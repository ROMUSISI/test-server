const { QueryTypes } = require("sequelize");
const { sequelize } = require("../databaseConnection/db");

const checkUnitStructure = async(req, res, next) => {
  const {unitId} = req.user;

  try {
    console.log('unit structure checked', unitId);
    //confirm the unit has an admin added
    const [unitAdmin] = await sequelize.query(
      `SELECT * FROM user 
       WHERE unitId = :unitId
       AND role = 'unit admin/accountant'
       LIMIT 1`,
       {
        type: QueryTypes.SELECT,
        replacements: {unitId}
       }
    );

    //confirm the unit has an M&E officer added
    const [unitMAndE] = await sequelize.query(
      `SELECT * FROM user 
       WHERE unitId = :unitId
       AND role = 'M&E Officer'
       LIMIT 1`,
       {
        type: QueryTypes.SELECT,
        replacements: {unitId}
       }
    );

    //confirm the unit has a head added
    const [unitHead] = await sequelize.query(
      `SELECT * FROM user 
       WHERE unitId = :unitId
       AND role = 'Head of unit'
       LIMIT 1`,
       {
        type: QueryTypes.SELECT,
        replacements: {unitId}
       }
    );

    if (!unitAdmin || !unitHead || !unitMAndE) {
      console.log('Your unit structure is not complete. An admin/FA, Unit head and M& E officer sholud be added')
      return res.status(401).json({
        status: 'Unauthorized',
        message: `Your unit should have a head (CPM), an adminstrator(FA) and M&E for you to register members or receipt money.
Please contact your M&E or IT to complete adding these members of your management team. Thank you.`
      })
    }

    next();

  } catch (error) {
    console.log('Error checking unit structure', error)
  }
};

module.exports = {
  checkUnitStructure
}