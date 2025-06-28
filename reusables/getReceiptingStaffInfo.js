const { QueryTypes } = require("sequelize")
const { sequelize } = require("../databaseConnection/db")

const getReceiptingStaffInfo = async(staffId) => {
  try {
    const staffInfoArray = await sequelize.query(
      `SELECT * 
       FROM user
       WHERE id = :staffId
       LIMIT 1`,
       {
        type: QueryTypes.SELECT,
        replacements: {staffId}
       }
    );

    const staffInfo = staffInfoArray[0];

    console.log('Receipting staff Info in getReceiptingStaffInfo fxn: ', staffInfo)

    return staffInfo;

  } catch (error) {
    console.log('Error retrieving receipting staff data: ', error)
  }
}

module.exports = {
  getReceiptingStaffInfo
}