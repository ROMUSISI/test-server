// routes/districtRoutes.js

const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

// Get all roles
router.get('/roles', roleController.getAllRoles);

module.exports = router;