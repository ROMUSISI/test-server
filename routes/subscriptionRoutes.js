const express = require ('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const {authenticateUser, checkTokenStatus} = require('../middleware/authenticateUserMiddleWare');
const { checkUnitStructure } = require('../middleware/checkUnitStructure');

router.get ('/subscription', subscriptionController.getAllMemberSubscriptions);

router.post ('/subscription',authenticateUser, checkUnitStructure, subscriptionController.createPayment)

router.get ('/memberpayments', authenticateUser, subscriptionController.getAllPayments)

router.get ('/payment/:id', subscriptionController.getPaymentById)

router.get ('/memberpayments/:id', subscriptionController.getAllPaymentsByMemberId)

router.put ('/payment/:id', subscriptionController.updatePayment)

router.get ('/unconfirmedpayments', authenticateUser, subscriptionController.getUnconfirmedPayments)

router.post ('/confirmpayments', authenticateUser, subscriptionController.confirmPayments)

router.put('/deletemanypayments',authenticateUser, subscriptionController.deleteManyPayments)

router.post('/verifypaymenttoken',authenticateUser, subscriptionController.verifyToken)

router.get('/createpaymenttoken',authenticateUser, subscriptionController.createToken)

router.get('/paymenttokenstatus',authenticateUser, subscriptionController.checkTokenStatus)

module.exports = router;