const express = require ('express')
const router = express.Router();
const userController = require ('../controllers/userController');
const {authenticateUser} = require('../middleware/authenticateUserMiddleWare');
const { checkRoleDuplication } = require('../middleware/checkRoleDuplication');
const { enforceOneEntryAccount } = require('../middleware/enforceOneEntryAccount');

router.get('/user', authenticateUser,
  userController.getAllUsers

);

router.get('/user/:id', 
  
  userController.getUserById

);

router.delete('/user/:id', 
  
  userController.deleteUser

);

router.post ('/user', authenticateUser, checkRoleDuplication, enforceOneEntryAccount,
  
  userController.createUser

);

router.post ('/login',

  userController.login // handler for logging in

);

router.put ('/user/:id', authenticateUser, checkRoleDuplication,

  userController.updateUser
  
)

//Routes for sign up steps. [These are not for verifying paymenst]

router.post('/verifyusername', userController.verifyUserName)

router.post('/verifytoken', userController.verifyToken)

router.post('/createpassword', userController.createPassword)

router.post('/confirmpassword', userController.confirmPassword)

module.exports = router;