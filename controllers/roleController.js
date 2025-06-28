const roleService = require ('../services/roleService');

//get all roles
const getAllRoles = async (req, res) => {
  try {
    const response = await roleService.getAllRoles()
    if(response && response.status === 'OK') {
      return res.status(200).json ({status: response.status, message: response.message, roles: response.roles})
    }
    if(response && response.status === 'Not Found') {
      return res.status(404).json ({status: response.status, message: response.message, roles: response.roles})
    }
    if(response && response.status === 'Error') {
      return res.status(400).json ({status: response.status, message: response.message, roles: response.roles})
    }
  } catch (error) {
    console.error (error.message || 'Internal server error');
    return res.status(500).json ({status: error.message || 'Error', message: 'Internal server error', roles: []})
  }
};

module.exports = {
  getAllRoles
}