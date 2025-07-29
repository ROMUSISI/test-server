const { QueryTypes } = require('sequelize')
const {sequelize} = require('../databaseConnection/db');
const { sendSmsBatches } = require('../reusables/sendSmsBatches');

const handleDraftMemberMessages = async(message, userId) => {
  try{
    const [insertId, affectedRows] = await sequelize.query(
      `INSERT INTO message
       (
        userId,
        message,
        draft
      )
        VALUES(
        :userId,
        :message,
        true
      )
       `,
       {
        replacements: {
          userId,
          message
        },
        
        type: QueryTypes.INSERT
       }
    );

    if(!insertId) {
      return({
        status: 'Bad Request',
        message: 'Failed to save draft. Try again'
      })
    }

    if(insertId) {
      return({
        status: 'OK',
        message: 'Message successifully saved as draft.'
      })
    }

    console.log('Saved draft message.' + 'ID: ' + insertId + 'Affected Rows: ' + affectedRows)

  }catch(error) {
    console.log('An error occurred while saving a draft message: ', error)
   
      return({
        status: 'Error',
        message: 'An error occurred while saving message as draft. Try again'
      })
  }
}

const handleSendMemberMessages = async(message, userId) => {
  try{
    //send message
    //get phone numbers of all members
    const membersArray = await sequelize.query(
      `SELECT 
        uniqueMemberId AS id, 
        memberName AS name, 
        phone1 AS phone
       FROM member
       WHERE deleted <> 1
      `,
      {
        type: QueryTypes.SELECT
      }

    );

    membersArray.map((member)=> {console.log('member name: ' + member.name + 'member phone: ' + member.phone)})

    if(!membersArray || membersArray.length === 0) {
      return({
        status: 'Not Found',
        message: 'No members were found'
      })
    };

    if(membersArray && membersArray.length > 0) {

      //send bulk sms
        await sendSmsBatches(membersArray, message);
      
      //Then save the message
      const [insertId, affectedRows] = await sequelize.query(
        `INSERT INTO message
         (
          dateSent,
          userId,
          message,
          sent
        )
        VALUES(
          Now(),
          :userId,
          :message,
          true
        )
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            userId,
            message
          }
        }
      )
      return ({
        status: 'OK',
        message: `${insertId ? 'Message sent and saved.' : 'Message sent but not saved.'}  Total recipients: ${membersArray.length}.`
      })
    }
    
  }catch(error) {
    console.log('An error ocurred while sending message: ', error)
      return ({
        status: 'Error',
        message: `${insertId ? 'Message sent and saved.' : 'Message sent but not saved.'}  Total recipients: ${membersArray.length}.`
      })
  }
};



const getAllMessages = async(userId, pageLimit, page, unitId, messageType) => {

  const limit = pageLimit;
  const offset = (Number(page)*Number(pageLimit) - Number(pageLimit))
  
  let mainQuery = '';
  let countQuery = '';
  let messageReplacements = {};

  if (messageType === 'draft' || 'sent') {

    mainQuery = 
      `WITH q1 AS
          (SELECT 
              m.id,
              m.dateCreated,
              m.dateSent,
              m.message,
              m.draft,
              m.sent,
              m.userId,
              u.staffName,
              u.unitId
            FROM 
              message m INNER JOIN user u
              ON m.userId = u.id)
            
          SELECT 
            *
            FROM q1
            WHERE q1.unitId = :unitId
            AND ${messageType === 'draft' ? 'draft = 1' : 'sent = 1'}
            ORDER BY
            dateCreated DESC
            LIMIT :limit
            OFFSET :offset
        `;

     countQuery = 
      `WITH q1 AS
        (SELECT 
            m.id,
            m.dateCreated,
            m.dateSent,
            m.message,
            m.draft,
            m.sent,
            m.userId,
            u.staffName,
            u.unitId
          FROM 
            message m INNER JOIN user u
            ON m.userId = u.id)
           
        SELECT 
          COUNT (id) AS total
          FROM q1
          WHERE q1.unitId = :unitId
          AND ${messageType === 'draft' ? 'draft = 1' : 'sent = 1'}
      `;

      messageReplacements = 
        {offset, limit, unitId};

  }


  if (messageType === 'queued') {

    mainQuery = 
      `WITH q1 AS
          (SELECT 
              m.id,
              m.date,
              m.message,
              m.unitId,
              m.phone
            FROM 
              messageQueue m)
           
        SELECT 
          *
          FROM q1
      `;

    countQuery = 
      `SELECT 
          COUNT (id) AS total
          FROM messageQueue
      `;

    messageReplacements = 
      {}
  }

  try {
    const messagesArray = await sequelize.query(
      mainQuery,
      {
        type: QueryTypes.SELECT,
        replacements: messageReplacements
      }
    );

    console.log('Messages Array: ', messagesArray)

    //get total messages and totalPages
    const [totalMessages] = await sequelize.query(
      countQuery,
        {
          type: QueryTypes.SELECT,
          replacements: {unitId}
        }
    );

    let totalPages;
    if (totalMessages){
      totalPages = Math.ceil(Number(totalMessages.total)/Number(pageLimit))
    };

    if(!messagesArray || messagesArray.length === 0) {
      return({
        status: 'Not Found',
        message: 'No messages were found',
        messagesArray: [],
        totalPages: 0
      })
    };

    if(messagesArray && messagesArray.length > 0) {
      return({
        status: 'OK',
        message: 'Messages successifully retrieved',
        messagesArray: messagesArray,
        totalPages: totalPages
      })
    };

  } catch (error) {
    console.log('An error occurred while retrieving message data: ', error)
      return({
        status: 'Error',
        message: 'An error occurred while retrieving messages data',
        messagesArray: [],
        totalPages: 0
      })
  }
};

const getMessageCounts = async () => {
  try {

    const [sentTotal] = await sequelize.query (
      `SELECT COUNT(id) AS total FROM message WHERE sent = 1`,
      {type: QueryTypes.SELECT}
    );

    const [draftTotal] = await sequelize.query (
      `SELECT COUNT(id) AS total FROM message WHERE draft = 1`,
      {type: QueryTypes.SELECT}
    );

    const [queuedTotal] = await sequelize.query (
      `SELECT COUNT(id) AS total FROM messageQueue`,
      {type: QueryTypes.SELECT}
    );

    const [logTotal] = await sequelize.query (
      `SELECT COUNT(id) AS total FROM messageLog WHERE message IS NOT NULL AND phone IS NOT NULL`,
      {type: QueryTypes.SELECT}
    );

    const [creditTotal] = await sequelize.query(

      `WITH q1 AS (
        SELECT MAX(id) AS id 
        FROM messageLog 
        WHERE credit IS NOT NULL
      )

      SELECT 
        m.credit AS total
        FROM messageLog m INNER JOIN q1
        ON m.id = q1.id
      `,
      {
        type: QueryTypes.SELECT
      }
    );

    return (
      {
        message: 'Message totals were successifully obtained', 
        status: 'OK',
        totals: {
          sentTotal: sentTotal.total || 0,
          draftTotal: draftTotal.total || 0,
          queuedTotal: queuedTotal.total || 0,
          logTotal: logTotal.total || 0,
          creditTotal: creditTotal.total || 0
        }
      }
    )

  } catch (error) {

    console.log('An error occurred while trying to get message totals: ', error)

    return (
      {
        message: 'An error happened while retrieving message totals', 
        status: 'Error',
        totals: {
          sentTotal: null,
          draftTotal: null,
          queuedTotal: null,
          logTotal: null,
          creditTotal: null
        }
      }
    )
  }
};



module.exports = {
  handleDraftMemberMessages,
  handleSendMemberMessages,
  getAllMessages,
  getMessageCounts
}