const {QueryTypes} = require ('sequelize');
const {sequelize} = require ('../databaseConnection/db');

//get all roles
const getAllRoles = async () => {
  try {
    const rolesArray = await sequelize.query (
      ` SELECT id AS Role 
        FROM role
        ORDER BY id ASC
      `,
      {
        type: QueryTypes.SELECT
      }
    );

    if (!rolesArray || !rolesArray[0]) {
      return ({status: 'Not Found', message: 'No role data found', roles: []})
    };

    if (rolesArray && rolesArray[0]) {
      return ({status: 'OK', message: 'Roles data successifully retrieved', roles: rolesArray})
    };

  } catch (error) {
    console.error (error.message || 'Error retrieving role data');
    return ({status: 'Error', message: error.message || 'Error retrieving role data', roles: []});
  }
}

module.exports = {
  getAllRoles
}