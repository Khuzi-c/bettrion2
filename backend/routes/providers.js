const express = require('express');
const router = express.Router();
const providersController = require('../controllers/providersController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', providersController.getAll);
router.get('/:id', providersController.getOne);

router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, providersController.create);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, providersController.update);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, providersController.delete);

module.exports = router;
