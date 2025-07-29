const { QueryTypes } = require('sequelize')
const {sequelize} = require('../../databaseConnection/db')

const storeSentMessage = async (message, phone, unitId) => {
  try {
    //store the message in the messageLog table
    const [inserId, affectedRows] = await sequelize.query(
      `INSERT INTO
        messageLog(
          message,
          unitId,
          phone
        )
       VALUES(
          :message,
          :unitId,
          :phone
       )`, {
        replacements: {
          message,
          unitId,
          phone
        },
        type: QueryTypes.INSERT
       }
    );

    console.log(`Insert Id of stored message: `, inserId)

    return inserId;
    
  } catch (error) {
    console.log('An error occurred while saving a sent message to the message Log table: ', error);
    return null;
  }
}

module.exports = {
  storeSentMessage
}