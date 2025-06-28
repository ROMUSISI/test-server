const {QueryTypes} = require ('sequelize');
const {sequelize} = require ('../databaseConnection/db');

//get all units
const getAllUnits = async () => {
  try {
    const unitsArray = await sequelize.query (
      ` SELECT id AS unit 
        FROM unit
        ORDER BY id ASC
      `,
      {
        type: QueryTypes.SELECT
      }
    );

    console.log('Retrieved units: ', unitsArray)

    if (unitsArray && unitsArray.length>0) {
      return ({status: 'OK', message: 'Units data successifully retrieved', units: unitsArray})
    };

    if (!unitsArray || !unitsArray.length>0) {
      return ({status: 'Not Found', message: 'No unit data found', units: []})
    };


  } catch (error) {
    console.error (error.message || 'Error retrieving unit data');
    return ({status: 'Error', message: error.message || 'Error retrieving unit data', units: []});
  }
}

module.exports = {
  getAllUnits
}