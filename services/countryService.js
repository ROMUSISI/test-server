const {QueryTypes} = require ('sequelize');
const {sequelize} = require ('../databaseConnection/db');

//get all countries
const getAllCountries = async () => {
  try {
    const countriesArray = await sequelize.query (
      ` SELECT id AS Country 
        FROM Country
        ORDER BY id ASC
      `,
      {
        type: QueryTypes.SELECT
      }
    );

    if (!countriesArray || !countriesArray[0]) {
      return ({status: 'Not Found', message: 'No country data found', countries: []})
    };

    if (countriesArray && countriesArray[0]) {
      return ({status: 'OK', message: 'Countries data successifully retrieved', countries: countriesArray})
    };

  } catch (error) {
    console.error (error.message || 'Error retrieving country data');
    return ({status: 'Error', message: error.message || 'Error retrieving country data', countries: []});
  }
};

async function getPaginatedCountries(myParams) {
  const { page, limit, offset } = myParams;
  const numLimit = parseInt(limit);
  try {
    // Query to fetch the paginated countries
    const countries = await sequelize.query(
      `SELECT * FROM Country LIMIT :numLimit OFFSET :offset`,
      {
        replacements: { numLimit, offset },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Query to fetch the total count of countries
    const totalCountResult = await sequelize.query(
      'SELECT COUNT(Id) AS totalCount FROM Country',
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const totalCount = totalCountResult[0].totalCount;

    // Return status, countries, and total count
    if (countries && countries.length) {
      console.log({ status: 'OK', countries, totalCount })
      return { status: 'OK', countries, totalCount };
    } else {
      return { status: 'ERROR', countries: [], totalCount: 0 };
    }
  } catch (error) {
    console.error(error);
    return { status: 'ERROR', countries: [], totalCount: 0 };
  }
};

module.exports = {
  getAllCountries,
  getPaginatedCountries
}