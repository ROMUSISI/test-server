const { QueryTypes } = require('sequelize')
const {sequelize} = require('../../databaseConnection/db')
const checkSmsCredit = async() => {
  try {
    //get the id in the last column of the messageLogTable
    const [maxId] = await sequelize.query(
      `SELECT MAX(id) AS id FROM messageLog`,
      {
        type: QueryTypes.SELECT
      }
    );

    let credit = null;
    const maximumId = [maxId.id]

    //Now get the credit balance which corresponds to the id
    if(maximumId) {
      const [creditObject] = await sequelize.query(
        `SELECT credit FROM messageLog WHERE id = :maximumId`,
        {
          type: QueryTypes.SELECT,
          replacements: {
            maximumId
          }
        }
      );
      credit = creditObject.credit;
    };

    console.log('Available sms credit is: ', credit)

    return credit;
    
  } catch (error) {
    console.log('An error occurred while getting credit balance: ', error)
    return null;
  }
}

module.exports = {
  checkSmsCredit
};