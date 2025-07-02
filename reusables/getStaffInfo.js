 //function to retrieve accountant and head of unit info for the newly registered member

const {QueryTypes } = require("sequelize");
const { sequelize } = require("../databaseConnection/db");

    //This information will be shared with the member and also the two staffs will be notified of the new member registered.
    const getStaffInfo = async(role, unitId) => {
      try {
        const staffDataArray = await sequelize.query(
          `SELECT staffName, phone, email FROM user
           WHERE unitId = :unitId AND role = :role
           LIMIT 1`,
           {
            type: QueryTypes.SELECT,
            replacements: {
              unitId, role
            }
           }
        );

        if(staffDataArray && staffDataArray[0]) {
          const staffData = staffDataArray[0]
          console.log('staff data for staff or the new member unit', staffData);
          return staffData;
        }
      } catch (error) {
        console.log('Error retrieving staff data for the unit of the new memeber', error);
        return;
      }
    }

    module.exports = {
      getStaffInfo
    }