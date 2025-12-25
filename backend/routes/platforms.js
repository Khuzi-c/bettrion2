const express = require('express');
const router = express.Router();
const platformsController = require('../controllers/platformsController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', platformsController.getAll);
router.get('/:id', platformsController.getOne);

// Protected Routes
router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, platformsController.create);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, platformsController.update);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, platformsController.delete);

module.exports = router;
