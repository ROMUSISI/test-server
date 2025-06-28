//In this case, the entry account is an account opened for another unit from another unit.
//It should strictly be for an M&E Officer and should be only one.
//The M&E ooficer of the newly enrolled unit will then open accounts for the rest of the users at the unit

const { QueryTypes } = require("sequelize");
const { sequelize } = require("../databaseConnection/db");

const enforceOneEntryAccount = async(req, res, next) => {

  const {unitId: openingUserUnitId, staffName: openingStaffName} = req.user; //facility trying to add another facility
  const {unitId: newUserUnitId, id: newUserId, role: newUserRole} = req.body; //facility being enrolled

  try {
    const [existingMAndE] = await sequelize.query (
      `SELECT *
       FROM User
       WHERE unitId = :newUserUnitId
       AND role = 'M&E Officer'
       LIMIT 1`,
       {
        type: QueryTypes.SELECT,
        replacements: {newUserUnitId}
       }
    );

    if((newUserRole !=='M&E Officer') && (openingUserUnitId !== newUserUnitId )) {
      return res.status(409).json({
        message: `Dear ${openingStaffName},\nYou can enroll only one M&E Officer for another Unit. 
For ${existingMAndE.unitId}, ${existingMAndE.staffName} is already registered as their ${existingMAndE.role}.
Kindly ask him to register the rest of the users at ${existingMAndE.unitId}. Thank you`
      })
    }

    next();
  } catch (error) {
   console.log('Error creating user: ', error) 
   return res.status(500).json({
    message: 'An error occured while creating user. Please try again.'+ error
   })
  }
};

module.exports = {
  enforceOneEntryAccount
}