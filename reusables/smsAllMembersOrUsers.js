const { QueryTypes } = require("sequelize");
const { sendSmsBatches } = require("./sendSmsBatches");
const { sequelize } = require("../databaseConnection/db");

const smsAllMembersOrUsers = async(message, recipientType, unitId) => {
  try {
    //Retrieve members names and their phone numbers

    const recipientQuery = recipientType === 'member' ?       
      `SELECT uniqueMemberId as id,
       memberName AS name,
       phone1 as phone
       FROM member
       WHERE unitId = :unitId
       AND deleted <> 1` : 
       `SELECT id,
        userName AS name,
        phone
        FROM user
        WHERE deleted <> 1`;

      const smsReplacements = recipientType === 'member' ? {unitId} : {}
    const recipientArray = await sequelize.query(
      recipientQuery, {
        type: QueryTypes.SELECT,
        replacements: smsReplacements
      }
    );

    if(!recipientArray || recipientArray.length === 0) {
      return ({
        status: 'Not Found',
        message: 'No recipients found'
      })
    };

    if(recipientArray && recipientArray.length > 0) {
        //send batched sms
        await sendSmsBatches(recipientArray, message);
       
      return ({
        status: 'OK',
        message: 'Messages were successifully sent'
      })
    }

  } catch (error) {
    console.log('An error occurred while trying to send bacthed messages', error);
    return ({
        status: 'Error',
        message: 'An error occured while sending messages'
      })
  }
};

module.exports = {
  smsAllMembersOrUsers
}