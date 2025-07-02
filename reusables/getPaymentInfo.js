const {QueryTypes } = require("sequelize")
const { sequelize } = require("../databaseConnection/db")

const getPaymentInfo = async(paymentId) => {
  try {

    const transactionInfoArray = await sequelize.query(
      `SELECT uniqueMemberId, amountPaid, category, receivedByuserId
       FROM subscription 
       WHERE id = :paymentId
       LIMIT 1`,
       {
        type: QueryTypes.SELECT,
        replacements: {paymentId}
       }
    );

    const transactionInfo = transactionInfoArray[0]; //object containing the transaction data
    const {uniqueMemberId} = transactionInfo;

    const memberInfoArray = await sequelize.query(
      `SELECT memberName, phone1, phone2, emailAddress, unitId
       FROM member WHERE
       uniqueMemberId = :uniqueMemberId
       LIMIT 1`,
       {
        type: QueryTypes.SELECT,
        replacements: {
          uniqueMemberId
        }
       }
    );

    const memberInfo = memberInfoArray[0] //object containing member data

    const paymentInfo = {...memberInfo, ...transactionInfo};

    return paymentInfo;

  } catch (error) {
    console.log('Error getting transaction info: ', error)
    return;
  }
};

module.exports = {
  getPaymentInfo
}