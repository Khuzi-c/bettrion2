const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Public
router.post('/check-in', userController.checkIn);

// Admin (Should be protected but using Direct Access for now per user request)
router.get('/admin/list', userController.getUsers);
router.put('/admin/:id/status', userController.updateUserStatus);

// Update Profile
// Fixed: authMiddleware is an object, we need verifyToken method
router.post('/link-phone', authMiddleware.verifyToken, userController.linkPhone);

module.exports = router;
