const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/view', analyticsController.recordView);
router.post('/click', analyticsController.recordClick);
router.get('/stats', authMiddleware.verifyToken, authMiddleware.isAdmin, analyticsController.getDashboardStats);

module.exports = router;
