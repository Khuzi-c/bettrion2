const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', settingsController.getSettings);
router.put('/', authMiddleware.verifyToken, authMiddleware.isAdmin, settingsController.updateSettings);

module.exports = router;
