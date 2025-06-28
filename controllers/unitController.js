const unitService = require ('../services/unitService');

//get all units
const getAllUnits = async (req, res) => {
  try {
    const response = await unitService.getAllUnits()
    if(response && response.status === 'OK') {
      return res.status(200).json ({status: response.status, message: response.message, units: response.units})
    }
    if(response && response.status === 'Not Found') {
      return res.status(404).json ({status: response.status, message: response.message, units: response.units})
    }
    if(response && response.status === 'Error') {
      return res.status(400).json ({status: response.status, message: response.message, units: response.units})
    }
  } catch (error) {
    console.error (error.message || 'Internal server error');
    return res.status(500).json ({status: error.message || 'Error', message: 'Internal server error', units: []})
  }
};

module.exports = {
  getAllUnits
}