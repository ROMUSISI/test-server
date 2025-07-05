const {sequelize} = require ('../databaseConnection/db');
const {QueryTypes} = require ('sequelize');
const { format } = require ('date-fns');
const { sendEmail } = require('../reusables/sendEmail');
const {sendYoolaSMS} = require('../reusables/sendYoolaSMS');
const { getStaffInfo } = require('../reusables/getStaffInfo');
const { getWelfareStatus } = require('../reusables/getWelfareStatus');

const getAllMembers = async (page, pageLimit, searchTerm, userInfo) => {
  const { unitId, role } = userInfo;

  const offset =  page && pageLimit ? (parseInt(page) - 1) * parseInt(pageLimit) : 0;
  const limit = pageLimit ? parseInt(pageLimit) : 0;
  const year = new Date().getFullYear(); 

  try {

    //await sendEmail('musisir@tasouganda.org', 'New payment to confirm', 'Click here to login and confirm new payments')

    const smsReceiver = {
      tel: '+256774290644',
      sms: 'Hello Ronnie, you finally succeeded in changing the world'
    }
    
    //await sendYoolaSMS(smsReceiver.tel, smsReceiver.sms)

    const members = await sequelize.query(
      `
      WITH FilteredMembers AS (
        SELECT * FROM member
        WHERE deleted <> 1
          ${role !== 'Director' ? 'AND unitId = :unitId' : ''}
          ${searchTerm ? `
            AND (
              LOWER(memberName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) 
              OR LOWER(uniqueMemberId) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
            )` : ''}
        ORDER BY id
       ${limit && offset ? 'LIMIT :limit OFFSET :offset' : ''}
      ),
      PaymentsSummary AS (
        SELECT 
          uniqueMemberId,
          MAX(CASE WHEN category != 'Welfare' THEN category ELSE NULL END) AS category,
          MAX(CASE WHEN category != 'Welfare' THEN categoryValue ELSE 0 END) AS categoryValue,
          SUM(CASE WHEN category != 'Welfare' THEN amountPaid ELSE 0 END) AS totalPaid
        FROM subscription
        WHERE yearSubscribed = :year
        AND deleted <> 1
        GROUP BY uniqueMemberId
      ),

      WelfareSummary AS (
        SELECT 
          uniqueMemberId,
          MAX(CASE WHEN category = 'Welfare' THEN category ELSE NULL END) AS category,
          MAX(CASE WHEN category = 'Welfare' THEN categoryValue ELSE 0 END) AS categoryValue,
          SUM(CASE WHEN category = 'Welfare' THEN amountPaid ELSE 0 END) AS totalPaid
        FROM subscription
        WHERE yearSubscribed = :year
        AND deleted <> 1
        GROUP BY uniqueMemberId
      )
      
      SELECT 
        mp.*,
        CASE 
          WHEN ws.totalPaid >= 10000 THEN 'active'
          ELSE 'inactive'
        END AS welfareStatus FROM 

      (
        SELECT 
          fm.*,
          ps.category,
          ps.categoryValue,
          ps.totalPaid,

          CASE 
            WHEN ps.categoryValue > 0 AND ps.totalPaid >= ps.categoryValue THEN 'active'
            ELSE 'inactive'
          END AS membershipStatus

        FROM FilteredMembers fm
        LEFT JOIN PaymentsSummary ps ON fm.uniqueMemberId = ps.uniqueMemberId )

        mp LEFT JOIN WelfareSummary ws ON mp.uniqueMemberId = ws.uniqueMemberId
      `,
      {
        replacements: {
          unitId,
          role,
          searchTerm: searchTerm || '',
          limit,
          offset,
          year,
        },
        type: QueryTypes.SELECT,
      }
    );

    // Total count for pagination
    const totalCountResult = await sequelize.query(
      `
      SELECT COUNT(*) AS totalCount FROM member
      WHERE deleted <> 1
        ${role !== 'Director' ? 'AND unitId = :unitId' : ''}
        ${searchTerm ? `
          AND (
            LOWER(memberName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) 
            OR LOWER(uniqueMemberId) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
          )` : ''}
      `,
      {
        replacements: {
          unitId,
          role,
          searchTerm: searchTerm || '',
        },
        type: QueryTypes.SELECT,
      }
    );

    return {
      status: 'OK',
      members,
      totalCount: totalCountResult[0].totalCount,
    };
  } catch (error) {
    console.error('Error fetching members:', error);
    return {
      status: 'Error',
      message: error.message || 'Unexpected error',
      members: [],
    };
  }
};



const getMemberById = async (id) => {
  try {
    const year = new Date().getFullYear();

    // 1. Fetch the member
    const [member] = await sequelize.query(
      `SELECT * FROM member WHERE uniqueMemberId = :id LIMIT 1`,
      {
        type: QueryTypes.SELECT,
        replacements: { id }
      }
    );

    if (!member) {
      return {
        status: 'Not Found',
        message: 'Member not found',
        member: {}
      };
    }

    // 2. Fetch the member's subscription summary (excluding Welfare)
    const [subscriptionSummary] = await sequelize.query(
      `
      SELECT
        MAX(CASE WHEN category != 'Welfare' THEN category END) AS category,
        MAX(CASE WHEN category != 'Welfare' THEN categoryValue END) AS categoryValue,
        SUM(CASE WHEN category != 'Welfare' THEN amountPaid ELSE 0 END) AS totalPaid
      FROM subscription
      WHERE uniqueMemberId = :id 
      AND yearSubscribed = :year
      AND deleted <> 1
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { id, year }
      }
    );

    // 3. Determine status
    const categoryValue = Number(subscriptionSummary?.categoryValue) || 0;
    const totalPaid = Number(subscriptionSummary?.totalPaid) || 0;

    const status =
      categoryValue > 0 && totalPaid >= categoryValue ? 'Active' : 'Inactive';

    const welfareStatus = await getWelfareStatus(id) 

      console.log('Member status: ', status)

    // 4. Return the enriched member object
    return {
      status: 'OK',
      message: 'Member found',
      member: {
        ...member,
        category: subscriptionSummary?.category || null,
        categoryValue,
        totalPaid,
        status,
        welfareStatus
      }
    };
  } catch (error) {
    console.error(error);
    return {
      status: 'Error',
      message: error.message || 'Error retrieving member data',
      member: {}
    };
  }
};


//Create member
const createMember = async (memberData, userInfo) => {

  //function to assign new member Ids after insertion.

  const generateMemberId = async(member) => {

    const {
            id : insertId,
            phone1: memberPhone1,
            phone2: memberPhone2,
            unitId: memberUnitId,
            emailAddress: memberEmailAddress
          } = member;

    //destructure the user info to get the staff name
    const{staffName: userName} = userInfo;
  try {

      const getIdExtension = (id) => {
        let idExtension = ''

        const idNum = Number(id);
        const idString = id.toString()

        idNum < 10 ? idExtension = '000000' + idString :
        idNum < 100 ? idExtension = '00000' + idString :
        idNum < 1000 ? idExtension = '0000' + idString :
        idNum < 10000 ? idExtension = '000' + idString :
        idNum < 100000 ? idExtension = '00' + idString :
        idNum < 1000000 ? idExtension = '0' + idString :
        idExtension = idString;

        return idExtension
      }
      const newMemberId = 'TS-'+ getIdExtension(Number(insertId))

      //now update the the unique member field for the new mwmber using the newMemberId value
      await sequelize.query (
        'Update member set uniquememberId = :newMemberId WHERE id = :insertId',
        {
          type:QueryTypes.UPDATE,
          replacements: {insertId, newMemberId}
        }
      );
      
      //Now retrieve unit admin info
      const unitAdminInfo = await getStaffInfo('unit admin/accountant', memberUnitId);
      console.log('unit admin info for the new member', unitAdminInfo);
      //destructure the above object
      const {
        staffName: unitAdminName,
        phone: unitAdminPhone,
        email: unitAdminEmailAddress
      } = unitAdminInfo;

      //Now get the unit head info
      const unitHeadInfo = await getStaffInfo('Head of unit', memberUnitId);
      console.log('Unit head info for new member', unitHeadInfo)
      //now destructure the above object
      const {
        staffName: unitHeadName,
        phone: unitHeadPhone,
        email: unitHeadEmailAddress
      } = unitHeadInfo;

      //Now get the unit m&E info
      const unitMAndEInfo = await getStaffInfo('M&E Officer', memberUnitId);
      console.log('Unit M&E info for new member', unitMAndEInfo)
      //now destructure the above object
      const {
        staffName: unitMAndEName,
        phone: unitMAndPhone,
        email: unitMAndEEmailAddress
      } = unitMAndEInfo;

      console.log('unit M&E info: ', unitMAndEInfo)

      //get total number of clients for the unit
      const getUnitMemberTotal = async(unitId) => {
        try {
          const totalArray = await sequelize.query(
            `SELECT COUNT(uniqueMemberId) AS total FROM member WHERE unitId = :unitId`,
            {
              type: QueryTypes.SELECT,
              replacements: {unitId}
            }
          );
          return totalArray[0].total
        } catch (error) {
          console.log('Error getting member total', error)
          return;
        }
      }

      const unitMemberTotal = (await getUnitMemberTotal(memberUnitId)).toString() || ''

      const unitEmailNotification = {
        to: unitMAndEEmailAddress.trim(),
        subject: `New TASO Subscriber member registered by ${userName}`.trim(),
        body: `Dear ${unitMAndEName}, 
        \nThis is to notify you that a new TASO subscriber member has been registered at ${memberUnitId}.
        \nMember name: ${memberName}, Member Id: ${newMemberId}
        \nPhone number(s):${memberPhone1 && memberPhone1} ${memberPhone2 && ',' + memberPhone2}
        \nEmail address: ${memberEmailAddress || 'No email address provided'}
        \nYour current ${memberUnitId} total membership is: ${unitMemberTotal}
        \nRegards,
        \nMyTASO\nThe Aids Support Organization,\nHealthy and empowered communities`.trim()
        ,
        cc: unitHeadEmailAddress.trim()
      }


      //Now send notifications to the member, unit head and unit admin
      const memberNotification = `
        Dear ${memberName}, you have been registered as a TASO Member ${newMemberId}. call ${unitAdminPhone}, ${unitHeadPhone} for detatails.
      `

      try {
        //send member notification
       // await sendYoolaSMS(memberPhone1 || memberPhone2, memberNotification.trim());

      } catch (error) {
        console.error('Error sending sms to new member')
      }

      try {
        //Notify the head of unit and the accountant
        sendEmail(
          unitEmailNotification.to, 
          unitEmailNotification.subject, 
          unitEmailNotification.body, 
          unitEmailNotification.cc
        )
      } catch (error) {
        console.error('error sending email to head of unit and admin: ', error)
      }
 
      return newMemberId.trim();

    } catch (error) {
    console.log('Service layer error assigning new id', error)
    return null;
  }
}

  //destructure incoming member data
  const {
    unitId = 'Taso Masindi',
    memberName,
    memberType,
    dob,
    country,
    district,
    subcounty = 'Not provided',
    parish,
    cell,
    createdByUserId = 1,
    phone1,
    phone2,
    emailAddress,
    lastModifiedByUserId =1
  } = memberData;

  //define replacements map
  const replacementsInsert = {
    unitId,
    memberName,
    memberType,
    dob,
    country,
    district,
    subcounty,
    parish,
    cell,
    createdByUserId,
    phone1,
    phone2,
    emailAddress,
    lastModifiedByUserId
  };

  //define query for inserting record
  const sqlInsertMember = `
    INSERT INTO member (
      unitId,
      memberName,
      memberType,
      dob,
      country,
      district,
      subcounty,
      parish,
      cell,
      createdByUserId,
      phone1,
      phone2,
      emailAddress,
      lastModifiedByUserId
    ) 
    VALUES (
      :unitId,
      :memberName,
      :memberType,
      :dob,
      :country,
      :district,
      :subcounty,
      :parish,
      :cell,
      :createdByUserId,
      :phone1,
      :phone2,
      :emailAddress,
      :lastModifiedByUserId 
    )
  `

  try {

    //create new record
    const createdMemberMetaData = await sequelize.query (
      sqlInsertMember,
      {
        replacements: replacementsInsert,
        type: QueryTypes.INSERT
      }
    );

    console.log(createdMemberMetaData); 

    //get the insert id the use it to retrieve the inserted record
    const insertId = createdMemberMetaData[0];

    //retrieve the newly inserted record
    const createdMemberArray = await sequelize.query (
      `
      SELECT * FROM member WHERE id = :insertId`,
      {
        replacements: {insertId},
        type: QueryTypes.SELECT
      }
    )

    console.log('NEWLY CREATED MEMBER IN SERVICE: ', createdMemberArray)



    if (createdMemberArray && createdMemberArray[0]) {
      const newMember = createdMemberArray[0];

      console.log('object of new member newly created: ', newMember)

      //Now generate unique memberId for the member
      const newId = await generateMemberId(newMember)

      return ({status: 'OK', message: 'Member was successifully created', member: newMember, newId: newId});
    }


  } catch (error) {

    console.error(error.message);
    return ({status: 'Error', message: error.message || 'Error occured while creating member ', member: {}});

  }
}


//update member
const updateMember = async(memberData) => {
  //destructure incoming member data
  const {
    id,
    unitId: newUnitId = 'Taso Masindi',
    uniqueMemberId: newUniqueMemberId,
    memberName: newMemberName,
    memberType: newMemberType,
    dob: newDob,
    country: newCountry,
    district: newDistrict,
    subcounty: newSubcounty = 'Kawempe',
    parish: newParish,
    cell: newCell,
    status: newStatus = 1,
    phone1: newPhone1,
    phone2: newPhone2,
    emailAddress: newEmailAddress,
    deleted: newDeleted = 0,
    lastModifiedByUserId: newLastModifiedByUserId = 1,
    timeLastModified: newTimeLastModified = (new Date()).toISOString().slice(0, 19).replace('T', ' ')
  } = memberData;

  //define replacements map
  const replacementsUpdate = {
    id,
    newUnitId,
    newUniqueMemberId,
    newMemberName,
    newMemberType,
    newDob,
    newCountry,
    newDistrict,
    newSubcounty,
    newParish,
    newCell,
    newStatus,
    newPhone1,
    newPhone2,
    newEmailAddress,
    newDeleted,
    newLastModifiedByUserId,
    newTimeLastModified,
  };

  //define query for updating record
  const sqlUpdateMember = `
    UPDATE member
    SET 
      unitId = :newUnitId,
      uniqueMemberId = :newUniqueMemberId,
      memberName = :newMemberName,
      memberType = :newMemberType,
      dob = :newDob,
      country = :newCountry,
      district = :newDistrict,
      subcounty = :newSubcounty,
      parish = :newParish,
      cell = :newCell,
      status = :newStatus,
      phone1 = :newPhone1,
      phone2 = :newPhone2,
      emailAddress = :newEmailAddress,
      deleted = :newDeleted,
      lastModifiedByUserId = :newLastModifiedByUserId,
      timeLastModified = :newTimeLastModified
    WHERE uniqueMemberId = :id;
  `

  //sql for confirming the record exists
  const sqlMemberExists = `
    SELECT * FROM member
    WHERE uniqueMemberId = :id
  `

  try {
    
  //confirm whether the member exists
  const memberExistsArray = await sequelize.query (
    sqlMemberExists,
    {
      replacements: {id},
      type: QueryTypes.SELECT
    }
  );

  if(!memberExistsArray || !memberExistsArray[0]) { //member does not exist
    return({status: 'Not Found', message: 'Member does not exist', member: {}})
  }

  if(memberExistsArray && memberExistsArray[0]) { //member exists, so proceed to edit the member
    //invoke sequelize.query to edit the member
    const updatedMemberMetaDataArray = await sequelize.query ( //at index 0 we have the number of affected rows
      sqlUpdateMember,
      {
        replacements: replacementsUpdate,
        type: QueryTypes.UPDATE
      }
    );

    console.log(updatedMemberMetaDataArray);

    if (updatedMemberMetaDataArray && updatedMemberMetaDataArray[1]>0) {
      return ({status: 'OK', message: 'Member data successifully updated', member: {}})
    }
    else {
      return ({status: 'Bad Request', message: 'failed to update member', member: {}})
    }

  }

} catch (error) {
   console.error (error.message);
   return ({status: 'Bad Request', message: 'error updating member', member: {}})
}

};

const deleteMember = async(memberId, staffName) => {
  //This function effects a soft delete for the selected member record and the corresponding payments
  try {

    //confirm the record exists
    const recordExists = await sequelize.query(
      `SELECT * FROM member 
       WHERE uniqueMemberId = :memberId`,
       {
        replacements: {memberId},
        type: QueryTypes.SELECT
       }
    );

    if (!recordExists || !recordExists[0]) {
      return ({
        status: 'Not Found',
        message: 'Specified Member record does not exist',
      })
    };

    if(recordExists && recordExists[0]) {

      //(soft) delete all payments corresponding to the member
      await sequelize.query (
        `UPDATE subscription 
         SET deleted = True
         WHERE uniqueMemberId = :memberId`,
         {
          type: QueryTypes.UPDATE,
          replacements: {memberId}
         }
      );

      //Then (soft) delete the member record
      await sequelize.query(
        `UPDATE member
         SET deleted = True, deletedBy = :staffName
         WHERE uniqueMemberId = :memberId`,
         {
          type: QueryTypes.UPDATE,
          replacements: {memberId, staffName}
         }
      )

      //Then return
      return ({
        status: 'OK',
        message: 'Member record and corresponding payments were deleted!',
      })
    }
  } catch (error) {
    console.log('Error deleting member record', error)

    return ({
      status: 'Error',
      message: 'Error deleting member record. Try again',
    })
  }
}

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
}