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

  try {
    const messagesArray = await sequelize.query(

      ` 
      WITH q1 AS
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
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {offset, limit, unitId}
      }
    );

    console.log('Messages Array: ', messagesArray)

    //get total messages and totalPages
    const [totalMessages] = await sequelize.query(
      ` 
      WITH q1 AS
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
      `,
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
}

module.exports = {
  handleDraftMemberMessages,
  handleSendMemberMessages,
  getAllMessages
}