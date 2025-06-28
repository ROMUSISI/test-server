// routes/districtRoutes.js

const express = require('express');
const router = express.Router();
const districtController = require('../controllers/districtController');

// Create a new district
router.post('/districts', districtController.createDistrict);

// Get all districts
router.get('/districts', districtController.getAllDistricts);

// Get a district by ID
router.get('/districts/:id', districtController.getDistrictById);

// Update a district by ID
router.put('/districts/:id', districtController.updateDistrict);

// Delete a district by ID
router.delete('/districts/:id', districtController.deleteDistrict);

module.exports = router;