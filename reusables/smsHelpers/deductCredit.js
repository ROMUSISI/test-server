const { QueryTypes } = require("sequelize")
const { sequelize } = require("../../databaseConnection/db")

const deductCredit = async (id) => {
  try {

    //get the prvious credit
    const prevId = Number(id) - 1

    const [prevCreditObject] = await sequelize.query(
      `SELECT credit FROM messageLog WHERE id = :prevId`,
      {
        replacements: {prevId},
        type: QueryTypes.SELECT
      }
    )

    const prevCredit = prevCreditObject.credit;

    const newCredit = Number(prevCredit) - 1;

    //Now update new credit
    await sequelize.query(
      `UPDATE messageLog SET credit = :newCredit WHERE id = :id`,
      {
        replacements: {
          newCredit,
          id
        },
        type: QueryTypes.UPDATE
      }
    )
  } catch (error) {
    console.log('An error occurred while deducting message credit inside the messageLog table: ', error)
  }
};

module.exports = {
  deductCredit
}