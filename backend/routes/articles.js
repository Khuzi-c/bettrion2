const express = require('express');
const router = express.Router();
const articlesController = require('../controllers/articlesController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', articlesController.getAll);
router.get('/:id', articlesController.getOne);

router.post('/', authMiddleware.verifyToken, authMiddleware.isAdmin, articlesController.create);
router.put('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, articlesController.update);
router.delete('/:id', authMiddleware.verifyToken, authMiddleware.isAdmin, articlesController.delete);

module.exports = router;
