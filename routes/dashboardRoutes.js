
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticateUserMiddleWare = require ('../middleware/authenticateUserMiddleWare')

// Get all countries
router.get('/dash-info', authenticateUserMiddleWare.authenticateUser, dashboardController.getDashInfo);

module.exports = router;