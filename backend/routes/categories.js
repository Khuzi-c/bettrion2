const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', categoriesController.getAll);
router.get('/:id', categoriesController.getOne);

router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, categoriesController.create);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, categoriesController.update);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, categoriesController.delete);

module.exports = router;
