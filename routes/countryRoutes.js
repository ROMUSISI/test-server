// routes/districtRoutes.js

const express = require('express');
const router = express.Router();
const countryController = require('../controllers/countryController');

// Get all countries
router.get('/countries', countryController.getAllCountries);

router.get('/pagedcountries', countryController.getPaginatedCountries);

module.exports = router;