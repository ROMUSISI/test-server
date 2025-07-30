const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController')
const { authenticateUser } = require('../middleware/authenticateUserMiddleWare');

// Get all categories
router.post('/sms-members', authenticateUser, messageController.handleMemberMessages);

router.post('/get-all-messages', authenticateUser, messageController.getAllMessages);

router.get('/get-message-counts', authenticateUser, messageController.getMessageCounts);

router.post('/top-up-sms', messageController.topUpSms);

module.exports = router;