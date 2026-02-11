const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const userController = require('../controllers/admin.users.controller');

router.use(protect);
router.use(authorize('admin'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserDetail);
router.put('/:id/status', userController.updateUserStatus);

module.exports = router;
