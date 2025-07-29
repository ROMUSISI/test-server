const { QueryTypes } = require("sequelize")
const { sequelize } = require("../../databaseConnection/db")

const queueMessage = async(message, phone, unitId) => {
  try {
    await sequelize.query(
      `INSERT INTO
        messageQueue(
          message,
          phone,
          unitId
        ) 
       VALUES(
        :message,
        :phone,
        :unitId
         )`,
         {
            replacements: {
              message,
              phone,
              unitId
            },
            type: QueryTypes.INSERT
         }
    );
  } catch (error) {
    console.log('An error occurred while saving unsent message in the messageQueue table: ', error)
  }
};

module.exports = {
  queueMessage
}