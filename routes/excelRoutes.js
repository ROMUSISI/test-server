
const express = require('express');
const router = express.Router();
const excelController = require('../controllers/excelController');
const { authenticateUser } = require('../middleware/authenticateUserMiddleWare');

//export all message logs
router.get('/export-sms-log', excelController.exportSmsLog);

//export all members
router.get('/export-all-members', authenticateUser, excelController.exportMembers);

//export all payments
router.get('/export-all-payments', authenticateUser, excelController.exportPayments);

module.exports = router;