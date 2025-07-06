const {sequelize} = require ('../databaseConnection/db');
const {QueryTypes} = require ('sequelize');
const {format} = require ('date-fns')
const bcrypt = require('bcryptjs');
const { sendYoolaSMS } = require('../reusables/sendYoolaSMS');
const { sendPaymentNotification } = require('../reusables/sendPaymentNotification');
const { sendEmail } = require('../reusables/sendEmail');

//get all subscriptions
const getAllMemberSubscriptions = async () => {
  try {

    //create a temporary table memberSubscription which is fed by a query pulling data fron the two tables
    await sequelize.query (

      `CREATE TEMPORARY TABLE MemberSubscriptions (
        subscriptionId INTEGER PRIMARY KEY NOT NULL AUTO_INCREMENT,
        memberId INTEGER,
        uniqueMemberId VARCHAR(50),
        unitId VARCHAR(50),
        memberName VARCHAR(50),
        yearSubscribed INTEGER,
        category VARCHAR(50),
        categoryValue VARCHAR(50),
        amountPaid DECIMAL (10,0),
        balance DECIMAL (10,0),
        deleted BOOLEAN
      )`,

      {
        type: QueryTypes.RAW
      }
    );

    //Then check if there are members
    const membersArray = await sequelize.query (
      `SELECT * FROM member LIMIT 1`
    )
    if (!membersArray || !membersArray[0]) { //No members
      return({status: 'Not Found', message: 'No members found', subscriptions: []})
    };

    //Then check if there are subscriptions
    const subscriptionsArray = await sequelize.query (
      `SELECT * FROM subscription LIMIT 1`
    )
    if (!subscriptionsArray || !subscriptionsArray[0]) { //No members
      return({status: 'Not Found', message: 'No subscriptions found', subscriptions: []})
    };

    //Populate the membersubscription table with total subscriptions grouped by client unique id, year subscribed and category
    const memberAnnualSubsArray = await sequelize.query(
      `
        INSERT INTO MEMBERSUBSCRIPTIONS (yearSubscribed, uniqueMemberId, category, categoryValue, AmountPaid)
        SELECT 
          yearSubscribed,
          uniqueMemberId,
          category,
          categoryValue,
          SUM(AmountPaid) AS AmountPaid
        FROM SUBSCRIPTION
        GROUP BY 
          yearSubscribed, 
          uniqueMemberId,
          category,
          categoryValue;
      `,
      {
        type: QueryTypes.INSERT, // This indicates that this is an INSERT operation
      }
    );

    if (!memberAnnualSubsArray || !memberAnnualSubsArray[1]) {
      return ({status: 'Error', message: 'Error retrieving member subscription data', subscriptions: []})
    }

    if (memberAnnualSubsArray && memberAnnualSubsArray[1]) {

      //add the rest of the member detail to the table
     const memberUpdateMetaData = await sequelize.query (
        `
          UPDATE Membersubscriptions AS ms
          INNER JOIN member AS m 
          ON ms.uniqueMemberId = m.uniqueMemberId
          SET 
          ms.unitId = m.unitId,
          ms.memberName = m.memberName;
        `,
        {
          type: QueryTypes.UPDATE
        }
      );

      //console.log(memberUpdateMetaData)

      //work out the balance column
      const balUpdateMetaData = await sequelize.query (
        `
          UPDATE Membersubscriptions
          SET BALANCE = CategoryValue - AmountPaid
        `,
        {
        type: QueryTypes.UPDATE
        }
      );

      //console.log(balUpdateMetaData);

    }

    // now select member subscription data from the temporary table
    const allSubscriptionsArray = await sequelize.query (
      `SELECT * FROM MemberSubscriptions
      `,
      {
        type: QueryTypes.SELECT
      }
    );

    if (allSubscriptionsArray && allSubscriptionsArray[0]) {
      return({status: 'OK', message: 'subscription records successifully retrieved', subscriptions: allSubscriptionsArray})
    }

    if (!allSubscriptionsArray || !allSubscriptionsArray[0]) {
      return({status: 'Not Found', message: 'No subcription records found', subscriptions: []})
    }

  } catch (error) {
    
    console.error (error.message || 'Error retrieving subscription records');
    return ({status: 'Error', message: error.message || 'Error retrieving subscription records', subscriptions: []});

  }finally {
    // Drop the temporary table when done
    //await sequelize.query(`DROP TEMPORARY TABLE IF EXISTS MemberSubscriptions`);
  }
};

//create a payment
const createPayment = async (paymentData) => {

  const {
    uniqueMemberId,
    receivedByUserId,
    yearSubscribed,
    category,
    amountPaid,
    paymentMode
  } = paymentData;

  console.log('payment data in service layer: ', paymentData);

  const categoryValue = category ? matchCategoryValue(category) : '';
  const categoryLower = category.toLowerCase();

  try {
    if (paymentMode === 'membership') {
      // Step 1: Fetch all categories the member has already paid for this year
      const existingCategories = await sequelize.query(
        `
          SELECT DISTINCT category
          FROM subscription
          WHERE uniqueMemberId = :uniqueMemberId
            AND yearSubscribed = :yearSubscribed
            AND deleted <> 1
        `,
        {
          replacements: { uniqueMemberId, yearSubscribed },
          type: QueryTypes.SELECT
        }
      );

      const existingCategoryNames = existingCategories.map(c => c.category.toLowerCase());
      const alreadyPaidThisCategory = existingCategoryNames.includes(categoryLower);

      const hasWelfare = existingCategoryNames.includes('welfare');
      const nonWelfareCategories = existingCategoryNames.filter(cat => cat !== 'welfare');

      // Step 2: Validate category combination rules
      if (!alreadyPaidThisCategory) {
        if (nonWelfareCategories.length >= 1 && categoryLower !== 'welfare') {
          // Already paid for one non-Welfare, trying to add another → reject
          return {
            status: 'Conflict',
            message: `Only one membership category is allowed per year in addition to Welfare.`,
            payment: []
          };
        }

        if (nonWelfareCategories.length >= 1 && hasWelfare && categoryLower !== 'welfare') {
          return {
            status: 'Conflict',
            message: `Cannot add another membership category. Only Welfare and one other membership allowed.`,
            payment: []
          };
        }

        if (nonWelfareCategories.length > 1) {
          return {
            status: 'Conflict',
            message: `Multiple membership categories not allowed in the same year.`,
            payment: []
          };
        }

        if (existingCategoryNames.length >= 2) {
          return {
            status: 'Conflict',
            message: `Maximum of two categories allowed: Welfare + one membership category.`,
            payment: []
          };
        }
      }

      // Step 3: Overpayment check (same category + year)
      const [paymentSummary] = await sequelize.query(
        `
          SELECT COALESCE(SUM(amountPaid), 0) AS totalPaid
          FROM subscription
          WHERE uniqueMemberId = :uniqueMemberId
            AND yearSubscribed = :yearSubscribed
            AND category = :category
            AND deleted <> 1
        `,
        {
          replacements: { uniqueMemberId, yearSubscribed, category },
          type: QueryTypes.SELECT
        }
      );

      const totalPaid = parseFloat(paymentSummary.totalPaid || 0);
      const balance = categoryValue - totalPaid;

      if (balance <= 0) {
        return {
          status: 'Conflict',
          message: `Member is already fully subscribed for ${category} in ${yearSubscribed}`,
          payment: []
        };
      }

      if (amountPaid > balance) {
        return {
          status: 'Conflict',
          message: `Overpayment not allowed. Remaining balance for ${category} in ${yearSubscribed} is ${balance}`,
          payment: []
        };
      }

      // Step 4: All checks passed – insert the payment
      return insertNewPayment(
        uniqueMemberId,
        receivedByUserId,
        yearSubscribed,
        category,
        categoryValue,
        amountPaid,
        paymentMode
      );
    }

    // Non-membership payments: no validation needed
    return insertNewPayment(
      uniqueMemberId,
      receivedByUserId,
      yearSubscribed,
      category,
      categoryValue,
      amountPaid,
      paymentMode
    );
  } catch (error) {
    console.error(error.message || 'Error creating payment');
    return {
      status: 'Error',
      message: error.message || 'Error creating payment',
      payment: {}
    };
  }
};

  //function for inserting new payment
  async function insertNewPayment(
          uniqueMemberId,
          receivedByUserId,
          yearSubscribed,
          category,
          categoryValue,
          amountPaid,
          paymentMode){
    try {

      paymentInsertQuery = paymentMode === 'membership' ?

        `
        INSERT INTO subscription(
          uniqueMemberId,
          receivedByUserId,
          yearSubscribed,
          category,
          categoryValue,
          amountPaid
        ) 
        VALUES (
          :uniqueMemberId,
          :receivedByUserId,
          :yearSubscribed,
          :category,
          :categoryValue,
          :amountPaid
        )
      `
      :

      `
      INSERT INTO subscription(
        uniqueMemberId,
        receivedByUserId,
        yearSubscribed,
        category,
        amountPaid
      ) 
      VALUES (
        :uniqueMemberId,
        :receivedByUserId,
        :yearSubscribed,
        'Welfare',
        :amountPaid
      )
    `

    const paymentInsertReplacements = paymentMode === 'membership' ?
      {
        uniqueMemberId,
        receivedByUserId,
        yearSubscribed,
        category,
        categoryValue,
        amountPaid
      }

      :

      {
        uniqueMemberId,
        receivedByUserId,
        yearSubscribed,
        amountPaid
      }


         
    const paymentMetaDataArray = await sequelize.query (
      paymentInsertQuery,
      {
        replacements: paymentInsertReplacements,
        type: QueryTypes.INSERT
      }
    );


    if (!paymentMetaDataArray || !paymentMetaDataArray[0]>0) {
      return ({status: 'Bad Request', message: 'Payment failed', payment: [] })
    }
  
    //console.log(paymentMetaDataArray);
  
    if (paymentMetaDataArray && paymentMetaDataArray[1]>0) {
      
      //retrieve the payment
      const paymentId = paymentMetaDataArray[0];
  
      const paymentArray = await sequelize.query (
        `
          SELECT * FROM subscription 
          WHERE id = :paymentId
        `,
        {
        type: QueryTypes.SELECT,
        replacements: {paymentId}
        }
      )

      //At this point try sending payment notifications
      try {
        await sendPaymentNotification(paymentId)
      } catch (error) {
        console.error('Error sending payment notifications in service layer: ', error
        )
      }

      console.log('payemnt array',paymentArray);
        return ({status: 'OK', message: 'Payment was successifully registred', payment: paymentArray })
     
    };
    } catch (error) {
      console.error(error.message || 'Error processing payment');
      return ({status: 'Error', message: 'Error processing payment', payment: [] })
    }
    
  }

  const getAllPayments = async (myParams, userInfo) => {
  const { page, pageLimit, searchTerm } = myParams;
  const { unitId, role } = userInfo;

  const limit = parseInt(pageLimit);
  const offset = (parseInt(page) - 1) * limit;

  try {
    // Define base query with filtering and optional search term
    const baseQuery = `
      SELECT 
        s.id,
        s.uniqueMemberId,
        s.receivedByUserId,
        s.timeReceived,
        s.yearSubscribed,
        s.category,
        s.amountPaid,
        u.staffName AS receivedByUserName,
        m.unitId,
        m.memberName
      FROM subscription AS s
      JOIN user AS u ON s.receivedByUserId = u.id
      JOIN member AS m ON s.uniqueMemberId = m.uniqueMemberId
      WHERE
        ${role === 'Director' ? '1=1' : 'm.unitId = :unitId'}
        ${searchTerm ? `
          AND (
            LOWER(m.uniqueMemberId) LIKE CONCAT('%', :searchTerm, '%')
            OR LOWER(m.memberName) LIKE CONCAT('%', :searchTerm, '%')
          )` : ''}
          AND m.deleted <> 1
          AND s.deleted <> 1
      ORDER BY s.timeReceived DESC
      ${limit ? 'LIMIT :limit OFFSET :offset' : ''}
    `;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM subscription AS s
      JOIN user AS u ON s.receivedByUserId = u.id
      JOIN member AS m ON s.uniqueMemberId = m.uniqueMemberId
      WHERE 
        ${role === 'Director' ? '1=1' : 'm.unitId = :unitId'}
        ${searchTerm ? `
          AND (
            LOWER(m.uniqueMemberId) LIKE CONCAT('%', :searchTerm, '%')
            OR LOWER(m.memberName) LIKE CONCAT('%', :searchTerm, '%')
          )` : ''}
          AND s.deleted <> 1
          AND m.deleted <> 1
    `;

    const replacements = {
      unitId,
      searchTerm: searchTerm?.toLowerCase(),
      limit,
      offset
    };

    // Execute data query
    const allPaymentsArray = await sequelize.query(baseQuery, {
      type: QueryTypes.SELECT,
      replacements
    });

    console.log('all payments: ', allPaymentsArray)

    // Execute count query
    const totalCountArray = await sequelize.query(countQuery, {
      type: QueryTypes.SELECT,
      replacements
    });

    const totalCount = totalCountArray[0]?.total || 0;

    if (!allPaymentsArray || allPaymentsArray.length === 0) {
      return {
        status: 'Not Found',
        message: 'No payments found',
        payments: [],
        totalCount: 0
      };
    }

    return {
      status: 'OK',
      message: 'Payments successfully retrieved',
      payments: allPaymentsArray,
      totalCount
    };

  } catch (error) {
    console.error('Error retrieving member payments:', error);

    return {
      status: 'Error',
      message: error.message || 'Error retrieving member payments',
      payments: [],
      totalCount: 0
    };
  }
};


//getPaymentById
const getPaymentById = async (id) => {
  try {
    const payments = await sequelize.query(
      `
      SELECT 
        s.id AS paymentId,
        s.uniqueMemberId,
        m.unitId,
        m.memberName,
        s.yearSubscribed,
        s.category,
        s.amountPaid,
        s.receivedByUserId,
        ru.userName AS receivedByUserName,
        s.timeReceived,
        s.lastModifiedByUserId,
        mu.userName AS lastModifiedByUserName,
        s.timeLastModified
      FROM subscription s
      INNER JOIN member m ON s.uniqueMemberId = m.uniqueMemberId
      LEFT JOIN user ru ON s.receivedByUserId = ru.id
      LEFT JOIN user mu ON s.lastModifiedByUserId = mu.id
      WHERE s.id = :id
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { id }
      }
    );

    if (!payments || payments.length === 0) {
      return { status: 'Not Found', message: 'Payment record not found', payment: {} };
    }

    return { status: 'OK', message: 'Successfully retrieved payment', payment: payments[0] };

  } catch (error) {
    console.error('Error retrieving payment:', error.message || error);
    return { status: 'Error', message: 'Error retrieving member payments', payment: {} };
  }
};

//getAllPaymentsByMemberId
const getAllPaymentsByMemberId = async(memberId) => {
  try {
    const memberPaymentsArray = await sequelize.query (
      ` SELECT 
          s.id, 
          s.uniqueMemberId,
          s.yearSubscribed,
          s.timeReceived, 
          s.amountPaid,
          s.category,
          u.staffName AS receiptedBy
        FROM subscription AS s
        LEFT JOIN user as u
        ON s.receivedByUserId = u.id
        WHERE ((s.uniqueMemberId = :memberId) AND (s.deleted <>1))
        ORDER BY s.timeReceived DESC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {memberId}
      }
    );

    console.log ('member payments: ', memberPaymentsArray)

    if (!memberPaymentsArray || !memberPaymentsArray[0]) {
      return ({status: 'Not Found', message: 'No payments', payments: []})
    }

    if (memberPaymentsArray && memberPaymentsArray[0]) {
      return ({status: 'OK', message: 'Payments successifully retrieved', payments: memberPaymentsArray})
    }

  } catch (error) {
    console.error (error.message || 'Error retrieving member payments')
    return ({status: 'Error', message: 'Error retrieving member payments', payments: []})
  }
}

//match category with categoryvalue
function matchCategoryValue (category){
  if (category === 'Pewter') {
    categoryValue = 10000
  }

  if (category === 'Silver') {
    categoryValue = 30000
  }

  if (category === 'Gold') {
    categoryValue = 50000
  }

  if (category === 'Diamond') {
    categoryValue = 100000
  }

  if (category === 'Platnum') {
    categoryValue = 200000
  };

  return categoryValue;
}

//updatePayment
const updatePayment = async (newPaymentData) => {
  //destructure the data from the incoming newPaymentData object
  const {
    id,
    amountPaid: newAmountPaid,
    lastModifiedByUserId: newLastModifiedByUserId,
    deleted: newDeleted = 0
  } = newPaymentData;

  const newtimeLastModified = format (new Date(), 'yyyy-MM-dd HH:mm:ss')

  try {
    //check whether the payment exists
    const paymentExistsArray = await sequelize.query (
      ` SELECT * FROM subscription WHERE id = :id`,
      {
        replacements: {id},
        type: QueryTypes.SELECT
      }
    );

    if (!paymentExistsArray || !paymentExistsArray[0]) {
      return ({status: 'Not Found', message: 'subscription not found', updatedPayment: []})
    }

    if (paymentExistsArray && paymentExistsArray[0]) {
      //proceed to update the payment record with new data
      const paymentUpdateMetaDataArray = await sequelize.query (
        ` UPDATE subscription 
          SET
            amountPaid = :newAmountPaid,
            lastModifiedByUserId = :newLastModifiedByUserId,
            deleted = :newDeleted,
            timeLastModified = :newtimeLastModified
          WHERE id = :id
        `,
         {
          type: QueryTypes.UPDATE,
          replacements: {id, newtimeLastModified, newDeleted, newLastModifiedByUserId, newAmountPaid}
         }
      );

      if (!paymentUpdateMetaDataArray || !paymentUpdateMetaDataArray[1]) {
        return ({status: 'Error', message: 'Payment update failed', updatedPayment: []})
      }

      if (paymentUpdateMetaDataArray && paymentUpdateMetaDataArray[1]) {
        //retrieve the updated payment data
        const updatedPaymentArray = await sequelize.query (
          ` SELECT * FROM subscription AS s
            WHERE s.id = :id
            LIMIT 1
          `,
          {
            type: sequelize.SELECT,
            replacements: {id}
          }
        );

        if (!updatedPaymentArray || !updatedPaymentArray[0]) {
          return ({status: 'Error', message: 'Payment update failed', updatedPayment: []})
        };

        if (updatedPaymentArray && updatedPaymentArray[0]) {
          return ({status: 'OK', message: 'Payment was successifully updated', updatedPayment: updatedPaymentArray[0]})
        };

      }

    }

  } catch (error) {
    console.error (error.message || 'Error updating payment record');
    return ({status: 'Error', message: 'Payment update failed', updatedPayment: []});    
  }
}

  const getUnconfirmedPayments = async (myParams, userInfo) => {
  const { page, pageLimit} = myParams;
  const { unitId, role } = userInfo;

  const limit = parseInt(pageLimit);
  const offset = (parseInt(page) - 1) * limit;

  try {
    // Define base query with filtering and optional search term
    const baseQuery = `
    With q1 as (

      SELECT 
        s.id,
        s.uniqueMemberId,
        s.receivedByUserId,
        s.timeReceived,
        s.yearSubscribed,
        s.category,
        s.amountPaid,
        s.confirmed,
        s.deleted,
        u.staffName,
        m.unitId,
        m.memberName
      FROM subscription AS s
      JOIN user AS u ON s.receivedByUserId = u.id
      JOIN member AS m ON s.uniqueMemberId = m.uniqueMemberId)

      SELECT * FROM q1 WHERE q1.confirmed = 0 AND q1.deleted = 0
      ${role === 'Director' ? '' :  'AND q1.unitId = :unitId'}
       
      ORDER BY q1.timeReceived DESC
      LIMIT :limit OFFSET :offset
    `;

    const countQuery = `
    With q1 as (

      SELECT 
        s.id,
        s.uniqueMemberId,
        s.receivedByUserId,
        s.timeReceived,
        s.yearSubscribed,
        s.category,
        s.amountPaid,
        s.confirmed,
        s.deleted,
        u.staffName,
        m.unitId,
        m.memberName
      FROM subscription AS s
      JOIN user AS u ON s.receivedByUserId = u.id
      JOIN member AS m ON s.uniqueMemberId = m.uniqueMemberId)

      SELECT COUNT(*) AS total FROM q1 WHERE q1.confirmed = 0 AND q1.deleted = 0
      ${role === 'Director' ? '' :  'AND q1.unitId = :unitId'}

    `;
    
    //define replacement objects
    const baseR = role === 'Director' ? {limit, offset} : {limit, offset, unitId}
    const countR = role === 'Director' ? {} : {unitId}
    

    // Execute data query
    const allPaymentsArray = await sequelize.query(baseQuery, {
      type: QueryTypes.SELECT,
      replacements: baseR
    });

    // Execute count query
    const totalCountArray = await sequelize.query(countQuery, {
      type: QueryTypes.SELECT,
      replacements: countR
    });

    const totalCount = totalCountArray[0]?.total || 0;

    if (!allPaymentsArray || allPaymentsArray.length === 0) {
      return {
        status: 'Not Found',
        message: 'No unconfirmed payments found',
        payments: [],
        totalCount: 0
      };
    }

    return {
      status: 'OK',
      message: 'unconfirmed payments successfully retrieved',
      payments: allPaymentsArray,
      totalCount
    };

  } catch (error) {
    console.error('Error retrieving unconfirmed payments:', error);

    return {
      status: 'Error',
      message: error.message || 'Error retrieving unconfirmed payments',
      payments: [],
      totalCount: 0
    };
  }
};

const confirmPayments = async (pendingArray) => {
  let confirmedPaymentCounter = 0;
  let stillUnconfirmed = 0;


  try {
    if (pendingArray && pendingArray.length > 0) {
      stillUnconfirmed = pendingArray.length;

      for (const payment of pendingArray) {
        if (Number(payment.confirmed) === 1) {
          const confirmedStatus = payment.confirmed;
          const paymentId = payment.id;

          await sequelize.query(
            `UPDATE subscription s
             SET s.confirmed = :confirmedStatus
             WHERE s.id = :paymentId`,
            {
              type: QueryTypes.UPDATE,
              replacements: { confirmedStatus, paymentId },
            }
          );

          confirmedPaymentCounter += 1;
          stillUnconfirmed -= 1;
        }
      }

      return {
        status: 'OK',
        message: 'payments successifully confirmed',
        confirmedPayments: confirmedPaymentCounter,
        unconfirmed: stillUnconfirmed
      };
    }

    // If no pending array
    return {
      status: 'OK',
      message: 'no payments were confirmed',
      confirmedPayments: 0,
      unconfirmed: stillUnconfirmed
    };
  } catch (error) {
    console.error('Error confirming payments:', error);

    return {
      status: 'Error',
      message: 'error confirming payments',
      confirmedPayments: 0,
      unconfirmed: stillUnconfirmed
    };
  }
};

const deleteManyPayments = async(pendingArray) => {
  
  let deleteCounter = 0;
  let stillUnconfirmed = pendingArray.length;
  let allPaymentsCounter = 0;

  try {
    
    for (const payment of pendingArray) {
      
      
      const paymentId = payment.id
      const confirmed = Number(payment.confirmed)
      //delete payment record from subscription table
     if(confirmed === 1) {

      console.log ('Payment marked for deletion:', payment)

      await sequelize.query(
        `UPDATE subscription set deleted = true where
         id = :paymentId`,
         {
          replacements: {paymentId},
          type: QueryTypes.UPDATE
         }
      );

      deleteCounter+=1
      stillUnconfirmed = stillUnconfirmed - 1
    }

    allPaymentsCounter+=1;

    }

    if (deleteCounter > 0) {

    return({
      status: 'OK',
      message: 'Items successifully deleted',
      stillUnconfirmed: stillUnconfirmed
    })

  } else {
      return({
      status: 'No Content',
      message: 'No payments to delete',
      stillUnconfirmed: 0
    })
  }


  } catch (error) {
    console.log('Error deleting unconfirmed payment: ', error);

    
    return({
      status: 'Error',
      message: 'Error deleting payments',
      stillUnconfirmed: allPaymentsCounter || 0
    })

  }
}

const createToken = async(userInfo) => {

  const {userId, phone, email} = userInfo;

  try {
  // Generate a random 6 digit number
      const confirmationToken = 100000 + Math.floor(Math.random()*900000);

      const salt = await bcrypt.genSalt(10)

      const hashedToken = await bcrypt.hash( confirmationToken.toString(), salt)

      //Try sending sms

      console.log('phone number retrieved: ', phone)

      if(phone) {
        try {

          await sendYoolaSMS(phone, confirmationToken);
        } catch (error) {
          console.error('An error occurred while sending token to phone to verify payments', error)
        }
      }

      if(email) {
        try {
          await sendEmail(
            email, 
            'Token for confirming or deleting payments'.trim(),
            `Token: ${confirmationToken}`.trim()

          )
        } catch (error) {
          console.error('An error occured while sending token for confirming or deleted payments: ', error)
        }
      }
      
      console.log('Phone token: ', confirmationToken)

      function maskPhoneNumber(phone) {
        const phoneStr = String(phone); // Convert to string in case it's a number
        const length = phoneStr.length;

        if (length <= 7) return phoneStr; // Not enough characters to mask

        const firstPart = phoneStr.slice(0, 5);
        const lastPart = phoneStr.slice(-2);
        const maskedMiddle = 'x'.repeat(length - 7); // characters between first 5 and last 2

        return firstPart + maskedMiddle + lastPart;
      }

      const phoneHint = maskPhoneNumber(phone)

      await sequelize.query (
        ` UPDATE user 
          SET token = :hashedToken,
          tokenVerified = NULL,
          tokenCreatedAt = NOW() 
          WHERE id = :userId`,
        {
          replacements: {userId, hashedToken},
          type: QueryTypes.UPDATE
        }
      )

      return ({
        status: 'OK',
        tokencreated: true,
        phone: phoneHint
      })

  } catch (error) {
    console.log ('Error generating token: ', error)
        return ({
        status: 'Error',
        tokencreated: false,
        phone: null
      })
  }
}

const verifyToken = async (userInfo, phoneToken) => {
  const { userId } = userInfo;

  try {
    const dbTokenArray = await sequelize.query(
      `SELECT token FROM user WHERE id = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    const dbToken = dbTokenArray[0]?.token;

    console.log('myDbToken:', dbToken);
    console.log('phone token in service layer:', phoneToken);

    const tokenMatches = await bcrypt.compare(phoneToken.toString(), dbToken);

    if(tokenMatches) {
      await sequelize.query(
        `UPDATE user SET tokenverified = true where id = :userId`,
        {
          type: QueryTypes.UPDATE,
          replacements: {userId}
        }
      )
    }

    return {
      status: 'OK',
      tokenVerified: tokenMatches
    };

  } catch (error) {
    console.log('Error verifying token:', error);
    return {
      status: 'Error',
      tokenVerified: false
    };
  }
};

const checkTokenStatus = async (userInfo) => {
  const { userId: id, phone } = userInfo;

  try {
    const userTokenArray = await sequelize.query(
      `SELECT token, tokenVerified, tokenCreatedAt
       FROM user 
       WHERE id = :id`,
      {
        type: QueryTypes.SELECT,
        replacements: { id },
      }
    );

    if (userTokenArray && userTokenArray[0]) {
      const { token, tokenVerified, tokenCreatedAt } = userTokenArray[0];
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

      if (token && tokenVerified && new Date(tokenCreatedAt) >= tenMinutesAgo) {
        return {
          status: 'OK',
          tokenStatus: 'Verified',
        };
      }

      if (token && !tokenVerified && new Date(tokenCreatedAt) >= tenMinutesAgo) {
        return {
          status: 'OK',
          tokenStatus: 'validNotVerified',
        };
      }

      return {
        status: 'OK',
        tokenStatus: 'invalidOrMissing',
      };
    } else {
      return {
        status: 'Not Found',
        tokenStatus: 'invalidOrMissing',
      };
    }
  } catch (error) {
    console.error('Error verifying phone: ', error);

    return {
      status: 'Error',
      tokenStatus: 'invalidOrMissing',
    };
  }
};

module.exports = {
  getAllMemberSubscriptions,
  createPayment,
  getAllPayments,
  getPaymentById,
  getAllPaymentsByMemberId,
  updatePayment,
  getUnconfirmedPayments,
  confirmPayments,
  deleteManyPayments,
  createToken,
  verifyToken,
  checkTokenStatus
}
