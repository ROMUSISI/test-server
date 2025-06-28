const categoryService = require ('../services/categoryService');

//get all categories
const getAllCategories = async (req, res) => {
  try {
    const response = await categoryService.getAllCategories()
    if(response && response.status === 'OK') {
      return res.status(200).json ({status: response.status, message: response.message, categories: response.categories})
    }
    if(response && response.status === 'Not Found') {
      return res.status(404).json ({status: response.status, message: response.message, categories: response.categories})
    }
    if(response && response.status === 'Error') {
      return res.status(400).json ({status: response.status, message: response.message, categories: response.categories})
    }
  } catch (error) {
    console.error (error.message || 'Internal server error');
    return res.status(500).json ({status: error.message || 'Error', message: 'Internal server error', categories: []})
  }
};

module.exports = {
  getAllCategories
}