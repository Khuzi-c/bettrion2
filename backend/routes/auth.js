const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

// Admin Login
router.post('/login', authController.login);

// User Auth
router.post('/register', authController.register);
router.post('/user-login', authController.userLogin);
router.post('/verify', authController.verify);
router.post('/resend-verification', authController.resendVerification);
router.post('/check-status', authController.checkStatus); // Polling
router.get('/verify-link', authController.verifyLink); // Magic Link
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/firebase', authController.firebaseLogin);
router.post('/google', authController.googleLogin);
router.get('/my-ip', authController.getMyIp); // Public IP Info for Frontend

// Google Auth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email', 'https://www.googleapis.com/auth/user.birthday.read'] }));

// Discord Auth Routes
router.get('/discord', authController.discordLogin);
router.get('/discord/callback', authController.discordCallback);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login-failed.html', session: false }),
    (req, res) => {
        // Successful authentication
        const user = req.user;

        // Generate JWT for Frontend
        const token = jwt.sign(
            {
                id: user.id,
                username: user.name,
                email: user.email,
                role: 'user', // Normal user
                avatar: user.avatar
            },
            process.env.JWT_SECRET || 'bettrion_jwt_secret_v2',
            { expiresIn: '30d' }
        );

        // Redirect to Frontend with Token
        // In production, might want to use a cookie or a safer handoff, but query param is standard for simple OAuth
        res.redirect(`/?token=${token}`);
    }
);

module.exports = router;
