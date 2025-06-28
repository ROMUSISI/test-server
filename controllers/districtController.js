// controllers/districtController.js

const districtService = require('../services/districtService');

// Create a new district
const createDistrict = async (req, res) => {
  try {
    const districtData = req.body;
    const newDistrict = await districtService.createDistrict(districtData);
    res.status(201).json(newDistrict);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all districts
const getAllDistricts = async (req, res) => {
  try {
    const districts = await districtService.getAllDistricts();
    res.status(200).json(districts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a district by ID
const getDistrictById = async (req, res) => {
  try {
    const districtId = req.params.id;
    const district = await districtService.getDistrictById(districtId);
    res.status(200).json(district);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// Update a district by ID
const updateDistrict = async (req, res) => {
  try {
    const districtId = req.params.id;
    const districtData = req.body;
    const updatedDistrict = await districtService.updateDistrict(districtId, districtData);
    res.status(200).json(updatedDistrict);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a district by ID
const deleteDistrict = async (req, res) => {
  try {
    const districtId = req.params.id;
    await districtService.deleteDistrict(districtId);
    res.status(200).json({ message: 'District deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDistrict,
  getAllDistricts,
  getDistrictById,
  updateDistrict,
  deleteDistrict,
};