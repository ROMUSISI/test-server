const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController')
const { authenticateUser } = require('../middleware/authenticateUserMiddleWare');

// Get all categories
router.post('/sms-members', authenticateUser, messageController.handleMemberMessages);

router.post('/get-all-messages', authenticateUser, messageController.getAllMessages);

module.exports = router;