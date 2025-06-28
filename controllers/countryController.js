const countryService = require ('../services/countryService');

//get all countries
const getAllCountries = async (req, res) => {
  try {
    const response = await countryService.getAllCountries()
    if(response && response.status === 'OK') {
      return res.status(200).json ({status: response.status, message: response.message, countries: response.countries})
    }
    if(response && response.status === 'Not Found') {
      return res.status(404).json ({status: response.status, message: response.message, countries: response.countries})
    }
    if(response && response.status === 'Error') {
      return res.status(400).json ({status: response.status, message: response.message, countries: response.countries})
    }
  } catch (error) {
    console.error (error.message || 'Internal server error');
    return res.status(500).json ({status: error.message || 'Error', message: 'Internal server error', countries: []})
  }
};

const getPaginatedCountries = async (req, res) => {
  // Destructure incoming data (page and limit are now coming from query parameters)
  const { page = 1, limit = 20 } = req.query;  // Use req.query for URL parameters, not req.body
  const offset = (page - 1) * limit;
  const myParams = { page, limit, offset };

  try {
    // Fetch the paginated countries
    const response = await countryService.getPaginatedCountries(myParams);
    
    if (response.status === 'OK') {
      console.log ({response})
      return res.status(200).json({
        status: response.status,
        items: response.countries, // Send the countries as 'items'
        totalCount: response.totalCount, // Send the total count of records
      });
    } else {
      return res.status(400).json({ status: 'ERROR', message: 'No data found' });
    }
  } catch (error) {
    console.error(error.message || 'Internal server error');
    return res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
  }
};

module.exports = {
  getAllCountries,
  getPaginatedCountries
}



