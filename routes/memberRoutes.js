const express = require ('express');
const router = express.Router();
const memberController = require ('../controllers/memberController');
const { authenticateUser} = require('../middleware/authenticateUserMiddleWare');
const { checkUnitStructure } = require('../middleware/checkUnitStructure');

//get all members
router.get ('/member', authenticateUser, memberController.getAllMembers);

//get member by id
router.get('/member/:id', authenticateUser, memberController.getMemberById);

router.post('/member', authenticateUser, checkUnitStructure, memberController.createMember);

router.put ('/member/:id', authenticateUser, memberController.updateMember);

router.put ('/deletemember/:id', authenticateUser, memberController.deleteMember)

module.exports = router;

