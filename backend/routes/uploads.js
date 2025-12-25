const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = '../frontend/assets/uploads/';
        if (req.path.includes('platform')) uploadPath += 'platforms/';
        else if (req.path.includes('article')) uploadPath += 'articles/';
        else if (req.path.includes('provider')) uploadPath += 'providers/';
        else uploadPath += 'misc/';

        // Ensure directory exists - though we created them in scaffolding
        // but multer needs absolute path usually or relative to process
        // Better to use absolute path
        cb(null, path.join(__dirname, '../', uploadPath));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/platform-logo', authMiddleware.verifyToken, authMiddleware.isAdmin, upload.single('logo'), (req, res) => {
    res.json({ path: '/assets/uploads/platforms/' + req.file.filename });
});

router.post('/platform-banner', authMiddleware.verifyToken, authMiddleware.isAdmin, upload.single('banner'), (req, res) => {
    res.json({ path: '/assets/uploads/platforms/' + req.file.filename });
});

router.post('/article-thumbnail', authMiddleware.verifyToken, authMiddleware.isAdmin, upload.single('thumbnail'), (req, res) => {
    res.json({ path: '/assets/uploads/articles/' + req.file.filename });
});

router.post('/provider-logo', authMiddleware.verifyToken, authMiddleware.isAdmin, upload.single('logo'), (req, res) => {
    res.json({ path: '/assets/uploads/providers/' + req.file.filename });
});

module.exports = router;
