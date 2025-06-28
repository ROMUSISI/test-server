// routes/districtRoutes.js

const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');

// Get all units
router.get('/units', unitController.getAllUnits);

module.exports = router;