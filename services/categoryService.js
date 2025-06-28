const {QueryTypes} = require ('sequelize');
const {sequelize} = require ('../databaseConnection/db');

//get all categories
const getAllCategories = async () => {
  try {
    const categoriesArray = await sequelize.query (
      ` SELECT id AS Category 
        FROM Category
        ORDER BY id ASC
      `,
      {
        type: QueryTypes.SELECT
      }
    );

    if (!categoriesArray || !categoriesArray[0]) {
      return ({status: 'Not Found', message: 'No category data found', categories: []})
    };

    if (categoriesArray && categoriesArray[0]) {
      return ({status: 'OK', message: 'Categories data successifully retrieved', categories: categoriesArray})
    };

  } catch (error) {
    console.error (error.message || 'Error retrieving category data');
    return ({status: 'Error', message: error.message || 'Error retrieving category data', categories: []});
  }
}

module.exports = {
  getAllCategories
}