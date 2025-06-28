const { QueryTypes } = require("sequelize");
const { sequelize } = require("../databaseConnection/db");

const getWelfareStatus = async(id) => {

  try {
    
   const year = new Date().getFullYear()

    const [welfare] = await sequelize.query(
      `SELECT SUM(amountPaid) AS total FROM Subscription
        WHERE uniqueMemberId = :id 
        AND yearSubscribed = :year
        AND category = 'Welfare'
        AND deleted <> 1
      `,
      {
        replacements: {id, year},
        type: QueryTypes.SELECT
      }
    );

    const welfareStatus = Number(welfare.total) >= 10000 ? 'Active' : 'Inactive';
    
    console.log('Welfare status: ', welfareStatus)

    return welfareStatus;

  } catch (error) {
    console.error('Error computing welfare status', error)
    return;
  }
}

module.exports = {
  getWelfareStatus
}