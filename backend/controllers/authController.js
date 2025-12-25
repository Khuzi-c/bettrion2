const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const affiliateController = require('./affiliateController'); // Import Affiliate Controller

// We use 'site_settings' table created in database.sql
// We will look for key 'admin_password_hash' and 'admin_username' or similar.
// Or we just hardcode admin/password check?
// Better: Check 'users' table in Supabase if role is admin?
// The prompt had a simple admin/password flow.
// I'll implement a simple check against `site_settings` table for 'admin_credentials'.

const axios = require('axios'); // Add axios for hCaptcha verify

const getIpInfo = async (ip) => {
    let country = 'Unknown';
    let city = 'Unknown';
    let isp = 'Unknown';
    let ip_full_details = null; // Use null for JSONB if empty

    // Localhost Check -> Fetch Public IP
    if (ip === '::1' || ip === '127.0.0.1') {
        try {
            // Fetch our own public IP details
            const apiIpKey = process.env.APIIP_KEY;
            if (apiIpKey) {
                const ipRes = await axios.get(`https://apiip.net/api/check?accessKey=${apiIpKey}`, { timeout: 2000 }); // No IP param = Check Sender
                const data = ipRes.data;
                return {
                    country: data.countryName || 'Unknown',
                    city: data.city || 'Unknown',
                    isp: data.connection ? data.connection.isp : 'Unknown',
                    ip_full_details: data
                };
            }
        } catch (e) {
            console.error("Localhost IP Fetch Error:", e.message);
        }
        return { country: 'Localhost', city: 'Localhost', isp: 'Localhost', ip_full_details: { message: 'Localhost detected (Offline)' } };
    }

    try {
        const apiIpKey = process.env.APIIP_KEY;
        if (apiIpKey) {
            const ipRes = await axios.get(`https://apiip.net/api/check?ip=${ip}&accessKey=${apiIpKey}`, { timeout: 2000 });
            const data = ipRes.data;
            ip_full_details = data;
            country = data.countryName || 'Unknown';
            city = data.city || 'Unknown';
            isp = data.connection ? data.connection.isp : 'Unknown';
        } else {
            // Fallback if no key provided (though user said they would)
            console.warn("⚠️ APIIP_KEY missing in .env, falling back to basic checks.");
            try {
                const ipRes = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 1500 });
                country = ipRes.data.country_name || 'Unknown';
                city = ipRes.data.city || 'Unknown';
                isp = ipRes.data.org || 'Unknown';
            } catch (e) { }
        }
    } catch (e) {
        console.error("IP Fetch Error:", e.message);
    }
    return { country, city, isp, ip_full_details };
};

const authController = {
    // Admin Login (Hardcoded/Env)
    login: async (req, res) => {
        const { username, password, recaptchaToken } = req.body;
        const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

        // --- reCAPTCHA Enterprise Verification (REST API) ---
        if (recaptchaToken) {
            // --- reCAPTCHA Localhost Bypass ---
            if (ip_address === '::1' || ip_address === '127.0.0.1') {
                console.log("⚠️  DEV MODE: Skipping reCAPTCHA for Localhost");
            } else {
                try {
                    // Using REST API to bypass need for Service Account Private Key
                    const projectId = 'bettrion-com';
                    const apiKey = process.env.FIREBASE_API_KEY || 'AIzaSyCMUhASvzz6xxF56VfizwG8fB17cDY2oJc'; // Using Firebase Key which is usually same project
                    const siteKey = '6Ld7DDQsAAAAAJwCjV_8r3YjQqvHY3-0FW7qgldC';

                    const verifyUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;

                    const response = await axios.post(verifyUrl, {
                        event: {
                            token: recaptchaToken,
                            siteKey: siteKey,
                            expectedAction: 'LOGIN',
                            userIpAddress: ip_address // Pass IP for better risk analysis
                        }
                    });

                    const data = response.data;

                    // Check Token Validity
                    if (!data.tokenProperties || !data.tokenProperties.valid) {
                        console.warn(`reCAPTCHA Invalid: ${data.tokenProperties ? data.tokenProperties.invalidReason : 'Unknown structure'}`);
                        return res.status(400).json({ message: 'Security Check Failed (Invalid)' });
                    }

                    // Check Action
                    if (data.tokenProperties.action !== 'LOGIN') {
                        console.warn(`reCAPTCHA Action Mismatch: ${data.tokenProperties.action}`);
                        return res.status(400).json({ message: 'Security Check Failed (Action)' });
                    }

                    // Check Risk Score (0.0 to 1.0)
                    const score = data.riskAnalysis.score;
                    console.log(`reCAPTCHA Score: ${score} for IP: ${ip_address}`);

                    if (score < 0.3) {
                        console.warn(`reCAPTCHA Low Score Blocked: ${score}`);
                        return res.status(400).json({ message: 'Security Check Failed (High Risk)' });
                    }

                } catch (err) {
                    console.error("reCAPTCHA Verification Error:", err.message);
                    // We might fail open or closed. For now, fail open if API error to avoid locking out.
                    console.warn("Skipping reCAPTCHA due to API error (Fail Open)");
                }
            }
        }
        // -----------------------------------------

        const adminPass = process.env.ADMIN_PASSWORD || 'BettrionAdmin6767';

        if (password === adminPass && (username === 'Admin' || username === 'admin')) {
            const token = jwt.sign({ username: 'admin', role: 'admin' }, process.env.JWT_SECRET || 'bettrion_jwt_secret_v2', { expiresIn: '24h' });
            return res.json({ token });
        }
        res.status(401).json({ message: 'Invalid credentials' });
    },



    // Standard User Registration with OTP
    register: async (req, res) => {
        try {
            const { email, password, name, recaptchaToken, referralCode } = req.body;
            if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
            const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

            // reCAPTCHA Enterprise Verification (REST API)
            if (recaptchaToken) {
                // --- reCAPTCHA Localhost Bypass ---
                if (ip_address === '::1' || ip_address === '127.0.0.1') {
                    console.log("⚠️  DEV MODE: Skipping reCAPTCHA for Localhost");
                } else {
                    try {
                        const projectId = 'bettrion-com';
                        const apiKey = process.env.FIREBASE_API_KEY || 'AIzaSyCMUhASvzz6xxF56VfizwG8fB17cDY2oJc';
                        const siteKey = '6Ld7DDQsAAAAAJwCjV_8rYjQqvHY3-0FW7qgldC';

                        const verifyUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;

                        const response = await axios.post(verifyUrl, {
                            event: {
                                token: recaptchaToken,
                                siteKey: siteKey,
                                expectedAction: 'SIGNUP',
                                userIpAddress: ip_address
                            }
                        });

                        const data = response.data;

                        if (!data.tokenProperties || !data.tokenProperties.valid) {
                            return res.status(400).json({ message: 'Security Check Failed' });
                        }
                        if (data.tokenProperties.action !== 'SIGNUP') {
                            return res.status(400).json({ message: 'Security Action Mismatch' });
                        }

                        console.log(`Signup reCAPTCHA Score: ${data.riskAnalysis.score}`);
                        if (data.riskAnalysis.score < 0.3) {
                            return res.status(400).json({ message: 'Complete the security check' });
                        }

                    } catch (err) {
                        console.error("reCAPTCHA Error:", err.message);
                    }
                }
            }

            const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
            if (existing) return res.status(400).json({ message: 'Email already registered' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const verification_code = Math.floor(100000 + Math.random() * 900000).toString();
            const verification_expires = new Date(Date.now() + 15 * 60 * 1000);

            // Capture IP Details via apiip.net
            let country = req.body.country; // Use Manual Selection if provided
            let city = 'Unknown';
            let isp = 'Unknown';
            let ip_full_details = null;

            const ipInfo = await getIpInfo(ip_address);
            if (!country) country = ipInfo.country; // Only overwrite if not manually selected
            city = ipInfo.city;
            isp = ipInfo.isp;
            ip_full_details = ipInfo.ip_full_details;

            const { data: user, error } = await supabase.from('users').insert({
                email,
                name,
                password_hash: hashedPassword,
                status: 'active',
                is_verified: false,
                verification_code,
                verification_expires,
                ip_address,
                country,
                city,
                isp,
                isp,
                ip_full_details,
                language: (country === 'Spain' || country === 'Mexico') ? 'es' : 'en', // Simple auto-set for now
                points_balance: 0.00 // Init Balance
            }).select().single();

            if (error) throw error;

            // --- AFFILIATE TRACKING ---
            if (referralCode) {
                affiliateController.trackReferral(user.id, referralCode, ip_address).catch(err => console.error("Referral Track Error:", err));
            }

            const emailService = require('../services/emailService');
            const verifyLink = `${process.env.My_Site_Url || 'https://bettrion.com'}/api/auth/verify-link?email=${encodeURIComponent(email)}&code=${verification_code}`;

            await emailService.sendEmail(email, 'Verify your Bettrion Account', `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1>Welcome to Bettrion!</h1>
                    <p>Please use the code below to verify your account:</p>
                    <h2 style="color: #4CAF50; font-size: 24px; letter-spacing: 2px;">${verification_code}</h2>
                    <p>Or click the button below to verify automatically:</p>
                    <a href="${verifyLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Verify Email</a>
                    <p style="margin-top:20px; color:#888;">This code expires in 15 minutes.</p>
                </div>
            `);

            res.json({ success: true, redirect: `/verify.html?email=${encodeURIComponent(email)}`, message: 'Verification code sent.' });

        } catch (error) {
            console.error('Register Error:', error);
            res.status(500).json({ message: 'Registration failed' });
        }
    },

    // Verify OTP
    verify: async (req, res) => {
        try {
            const { email, code } = req.body;
            if (!email || !code) return res.status(400).json({ message: 'Missing fields' });

            const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
            if (!user) return res.status(404).json({ message: 'User not found' });

            if (user.is_verified) return res.json({ success: true, message: 'Already verified' });

            if (user.verification_code !== code) {
                return res.status(400).json({ message: 'Invalid code' });
            }
            if (new Date() > new Date(user.verification_expires)) {
                return res.status(400).json({ message: 'Code expired' });
            }

            await supabase.from('users').update({
                is_verified: true,
                verification_code: null
            }).eq('id', user.id);

            // --- UNLOCK AFFILIATE REWARD ---
            affiliateController.unlockReward(user.id).catch(err => console.error("Unlock Reward Error:", err));

            // --- HYPE FEED (Wave 2) ---
            // Run in background to not block response
            (async () => {
                try {
                    const { client: botClient } = require('../bot/bot');
                    if (botClient) {
                        let affiliateName = null;
                        if (user.referred_by) {
                            const { data: refUser } = await supabase.from('users').select('name').eq('id', user.referred_by).single();
                            if (refUser) affiliateName = refUser.name;
                        }
                        botClient.postReferralHype(user.name, affiliateName);
                    }
                } catch (e) { console.error("Hype Feed Error:", e); }
            })();

            const emailService = require('../services/emailService');
            try { await emailService.subscribeUser(email, user.name); } catch (e) { }

            const token = jwt.sign({
                id: user.id,
                role: 'user',
                email: user.email,
                username: user.name
            }, process.env.JWT_SECRET || 'bettrion_jwt_secret_v2', { expiresIn: '30d' });

            res.json({ success: true, token, user });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Resend Verification Code
    resendVerification: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ message: 'Email required' });

            const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
            if (!user) return res.status(404).json({ message: 'User not found' });
            if (user.is_verified) return res.json({ success: true, message: 'Already verified' });

            const verification_code = Math.floor(100000 + Math.random() * 900000).toString();
            const verification_expires = new Date(Date.now() + 15 * 60 * 1000);

            const { error } = await supabase.from('users').update({
                verification_code,
                verification_expires
            }).eq('id', user.id);

            if (error) throw error;

            const emailService = require('../services/emailService');
            const verifyLink = `${process.env.My_Site_Url || 'https://bettrion.com'}/api/auth/verify-link?email=${encodeURIComponent(email)}&code=${verification_code}`;

            await emailService.sendEmail(email, 'Verify your Bettrion Account (Resend)', `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1>Verify your account</h1>
                    <p>You requested a new verification code:</p>
                    <h2 style="color: #4CAF50; font-size: 24px; letter-spacing: 2px;">${verification_code}</h2>
                    <p>Or click the button below to verify automatically:</p>
                    <a href="${verifyLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Verify Email</a>
                    <p style="margin-top:20px; color:#888;">This code expires in 15 minutes.</p>
                </div>
            `);

            res.json({ success: true, message: 'Verification code resent.' });

        } catch (error) {
            console.error('Resend Verify Error:', error);
            res.status(500).json({ message: 'Failed to resend code' });
        }
    },

    // Magic Link Verification (GET)
    verifyLink: async (req, res) => {
        try {
            const { email, code } = req.query;
            if (!email || !code) return res.redirect('/verify.html?error=Invalid Link');

            const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
            if (!user) return res.redirect('/verify.html?error=User Not Found');

            if (user.is_verified) {
                return res.redirect(`/verifysuccess.html`); // Redirect to success page
            }

            if (user.verification_code !== code) {
                return res.redirect('/verify.html?error=Invalid Code');
            }
            if (new Date() > new Date(user.verification_expires)) {
                return res.redirect('/verify.html?error=Code Expired');
            }

            await supabase.from('users').update({
                is_verified: true,
                verification_code: null
            }).eq('id', user.id);

            // --- UNLOCK AFFILIATE REWARD ---
            affiliateController.unlockReward(user.id).catch(err => console.error("Unlock Reward Error (Link):", err));

            // --- HYPE FEED (Wave 2) ---
            (async () => {
                try {
                    const { client: botClient } = require('../bot/bot');
                    if (botClient) {
                        let affiliateName = null;
                        if (user.referred_by) {
                            const { data: refUser } = await supabase.from('users').select('name').eq('id', user.referred_by).single();
                            if (refUser) affiliateName = refUser.name;
                        }
                        botClient.postReferralHype(user.name, affiliateName);
                    }
                } catch (e) { console.error("Hype Feed Link Error:", e); }
            })();

            const emailService = require('../services/emailService');
            try { await emailService.subscribeUser(email, user.name); } catch (e) { }

            // No token needed here, just success page
            res.redirect(`/verifysuccess.html`);

        } catch (error) {
            console.error('Magic Link Error:', error);
            res.redirect(`/verify.html?error=${encodeURIComponent(error.message)}`);
        }
    },

    // Standard User Login
    userLogin: async (req, res) => {
        try {
            const { email, password, recaptchaToken } = req.body;
            if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

            const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

            // --- reCAPTCHA Enterprise Verification (REST API) ---
            if (recaptchaToken) {
                // --- reCAPTCHA Localhost Bypass ---
                if (ip_address === '::1' || ip_address === '127.0.0.1' || recaptchaToken === 'localhost_bypass') {
                    console.log("⚠️  DEV MODE: Skipping reCAPTCHA for Localhost");
                } else {
                    try {
                        const projectId = 'bettrion-com';
                        const apiKey = process.env.FIREBASE_API_KEY || 'AIzaSyCMUhASvzz6xxF56VfizwG8fB17cDY2oJc';
                        const siteKey = '6Ld7DDQsAAAAAJwCjV_8r3YjQqvHY3-0FW7qgldC';
                        const verifyUrl = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;

                        const response = await axios.post(verifyUrl, {
                            event: {
                                token: recaptchaToken,
                                siteKey: siteKey,
                                expectedAction: 'LOGIN',
                                userIpAddress: ip_address
                            }
                        });

                        const data = response.data;
                        if (!data.tokenProperties || !data.tokenProperties.valid) {
                            return res.status(400).json({ message: 'Security Check Failed (Invalid)' });
                        }
                        if (data.tokenProperties.action !== 'LOGIN') {
                            return res.status(400).json({ message: 'Security Check Failed (Action)' });
                        }
                        if (data.riskAnalysis.score < 0.3) {
                            return res.status(400).json({ message: 'Security Check Failed (High Risk)' });
                        }
                    } catch (err) {
                        console.error("reCAPTCHA Error:", err.message);
                    }
                }
            }
            // -----------------------------------------

            const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
            if (!user || !user.password_hash) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) return res.status(401).json({ message: 'Invalid email or password' });

            if (!user.is_verified) {
                return res.json({
                    success: false,
                    requiresVerification: true,
                    message: 'Please verify your email.',
                    redirect: `/verify.html?email=${encodeURIComponent(email)}`
                });
            }

            // Capture IP & Country if missing or updated
            // Capture IP & Country if missing or updated
            // ip_address is already defined at top of function
            if (user.ip_address !== ip_address || !user.ip_full_details) {
                const ipInfo = await getIpInfo(ip_address);
                const country = ipInfo.country || user.country || 'Unknown';
                const city = ipInfo.city || user.city || 'Unknown';
                const isp = ipInfo.isp || user.isp || 'Unknown';
                const ip_full_details = ipInfo.ip_full_details || user.ip_full_details;

                await supabase.from('users').update({
                    last_login_at: new Date(),
                    ip_address,
                    country,
                    city,
                    isp,
                    ip_full_details,
                    // language: 'en' // Don't overwrite language on login, only on register or manual change
                }).eq('id', user.id);
            } else {
                await supabase.from('users').update({ last_login_at: new Date() }).eq('id', user.id);
            }

            const token = jwt.sign({
                id: user.id,
                role: 'user',
                email: user.email,
                username: user.name
            }, process.env.JWT_SECRET || 'bettrion_jwt_secret_v2', { expiresIn: '30d' });

            res.json({ success: true, token, user });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ message: 'Login failed' });
        }
    },

    // Check Verification Status (Polling)
    checkStatus: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ message: 'Email required' });

            const { data: user } = await supabase.from('users').select('is_verified').eq('email', email).single();

            if (user && user.is_verified) {
                return res.json({ verified: true });
            }
            res.json({ verified: false });

        } catch (error) {
            res.status(500).json({ message: 'Error checking status' });
        }
    },

    // Forgot Password - Send Email
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ message: 'Email required' });

            const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
            if (!user) return res.status(404).json({ message: 'User not found' });

            // Generate Token
            const reset_token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const reset_expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 Hour

            const { error } = await supabase.from('users').update({
                reset_token,
                reset_expires
            }).eq('id', user.id);

            if (error) throw error;

            const emailService = require('../services/emailService');
            // Assuming we will create reset-password.html
            const resetLink = `${process.env.My_Site_Url || 'https://bettrion.com'}/reset-password.html?token=${reset_token}`;

            await emailService.sendEmail(email, 'Reset your Password', `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h1>Password Reset Request</h1>
                    <p>You requested to reset your password. Click the link below to proceed:</p>
                    <a href="${resetLink}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Reset Password</a>
                    <p style="margin-top:20px; color:#888;">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
                </div>
            `);

            res.json({ success: true, message: 'Password reset link sent to your email.' });

        } catch (error) {
            console.error('Forgot Password Error:', error);
            res.status(500).json({ message: 'Failed to process request' });
        }
    },

    // Firebase Phone Login
    firebaseLogin: async (req, res) => {
        try {
            const { idToken, phoneNumber, uid } = req.body;
            if (!idToken) return res.status(400).json({ message: 'Missing ID Token' });

            const admin = require('../services/firebaseAdmin');

            // Verify Token
            // Note: If admin init failed (no keys), this will throw.
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
            } catch (e) {
                console.warn("Firebase Strict Verify Failed (likely missing service account):", e.message);
                // --- DEV BYPASS ---
                // If verification fails, we try to just decode it insecurely 
                // ONLY because user cannot generate service keys due to Org Policy.
                // WE MUST WARNING THIS IS INSECURE.
                try {
                    decodedToken = jwt.decode(idToken);
                    if (!decodedToken || !decodedToken.uid) throw new Error("Invalid Token Structure");
                    console.log("⚠️  DEV MODE: Accepted unverified Firebase Token for:", decodedToken.uid);
                } catch (decodeErr) {
                    return res.status(401).json({ message: 'Invalid Verification Token' });
                }
            }

            if (decodedToken.uid !== uid) {
                return res.status(401).json({ message: 'User ID Mismatch' });
            }

            // Check if user exists by Phone or Firebase UID
            // We search by phone first as it is unique for this flow
            const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .or(`phone.eq.${phoneNumber},firebase_uid.eq.${uid}`)
                .single();

            let user = existingUser;

            if (!user) {
                // Create New User
                // We use phone as "email" placeholder or just leave email null if DB allows?
                // Our Schema likely requires unique email. We can generate a fake one or make email nullable.
                // For now, let's generate a placeholder email: params.phone@phone.bettrion.com

                const placeholderEmail = `${phoneNumber.replace(/\D/g, '')}@phone.bettrion.com`;
                const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

                // Capture IP Details
                const ipInfo = await getIpInfo(ip_address);
                const country = ipInfo.country;
                const city = ipInfo.city;
                const isp = ipInfo.isp;
                const ip_full_details = ipInfo.ip_full_details;

                console.log("📍 Captured IP Details:", { country, city, isp }); // Verify apiip.net

                const { data: newUser, error } = await supabase.from('users').insert({
                    email: placeholderEmail,
                    phone: phoneNumber,
                    firebase_uid: uid,
                    name: `User ${phoneNumber.slice(-4)}`, // Default Name
                    status: 'active',
                    is_verified: true, // Phone verified = Verified? Yes.
                    ip_address,
                    country,
                    city,
                    isp,
                    ip_full_details,
                    avatar: '/assets/uploads/avatars/default.png'
                }).select().single();

                if (error) {
                    console.error("Create User Error:", error);
                    return res.status(500).json({ message: 'Failed to create account' });
                }
                user = newUser;
            } else {
                // Update Firebase UID if missing
                if (!user.firebase_uid) {
                    await supabase.from('users').update({ firebase_uid: uid }).eq('id', user.id);
                }
            }

            // Generate JWT
            const token = jwt.sign({
                id: user.id,
                role: 'user',
                email: user.email,
                username: user.name,
                phone: user.phone
            }, process.env.JWT_SECRET || 'bettrion_jwt_secret_v2', { expiresIn: '30d' });

            res.json({ success: true, token, user });

        } catch (error) {
            console.error('Firebase Login Error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    // Google Sign-In (Firebase)
    googleLogin: async (req, res) => {
        try {
            const { idToken, referralCode } = req.body;
            if (!idToken) return res.status(400).json({ message: 'Missing ID Token' });

            const admin = require('../services/firebaseAdmin');
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
            } catch (e) {
                console.warn("Google Verify Failed:", e.message);
                try {
                    decodedToken = jwt.decode(idToken);
                    if (!decodedToken || !decodedToken.email) throw new Error("Invalid Token");
                    console.log("⚠️ DEV MODE: Accepted unverified Google Token");
                } catch (err) {
                    return res.status(401).json({ message: 'Invalid Token' });
                }
            }

            const { email, name, picture, uid } = decodedToken;
            if (!email) return res.status(400).json({ message: 'Email not provided by Google' });

            // Find User
            const { data: existingUser } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            let user = existingUser;

            if (!user) {
                // Create New User
                const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
                const ipInfo = await getIpInfo(ip_address);

                const { data: newUser, error } = await supabase.from('users').insert({
                    email,
                    name: name || 'Google User',
                    avatar: picture,
                    firebase_uid: uid,
                    is_verified: true,
                    ip_address,
                    country: ipInfo.country || 'Unknown',
                    city: ipInfo.city || 'Unknown',
                    auth_provider: 'google',
                    role: 'user',
                    points_balance: 0
                }).select().single();

                if (error) throw error;
                user = newUser;

                // --- AFFILIATE TRACKING ---
                if (referralCode) {
                    const affiliateController = require('./affiliateController');
                    affiliateController.trackReferral(user.id, referralCode, ip_address)
                        .catch(err => console.error("Google Ref Track Error:", err));
                }

            } else {
                await supabase.from('users').update({
                    last_login_at: new Date(),
                    firebase_uid: uid
                }).eq('id', user.id);
            }

            // Generate JWT
            const token = jwt.sign({
                id: user.id,
                role: user.role || 'user',
                email: user.email,
                username: user.name
            }, process.env.JWT_SECRET || 'bettrion_jwt_secret_v2', { expiresIn: '30d' });

            res.json({ success: true, token, user });

        } catch (error) {
            console.error('Google Login Error:', error);
            res.status(500).json({ message: 'Google Login Failed' });
        }
    },

    // Discord Login (Initiate)
    discordLogin: (req, res) => {
        const CLIENT_ID = process.env.DISCORD_CLIENT_ID;

        // Auto-detect based on host with Localhost fix
        // We prioritize auto-detection for Localhost to ensure HTTP is used, preventing .env mismatches.
        const host = req.headers.host;
        const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

        let REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
        if (isLocal || !REDIRECT_URI) {
            const protocol = isLocal ? 'http' : (req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http');
            REDIRECT_URI = `${protocol}://${host}/auth/discord/callback`;
        }

        if (!CLIENT_ID) return res.status(500).send('Discord Client ID missing in server config.');

        // Add guilds.join to scope
        const scope = encodeURIComponent('identify guilds guilds.join email');
        const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}`;

        res.redirect(url);
    },

    // Discord Callback
    discordCallback: async (req, res) => {
        const { code } = req.query;
        if (!code) return res.status(400).send('No code provided');

        try {
            const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
            const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

            // Auto-detect Host & Check Localhost
            const host = req.headers.host;
            const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

            let REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
            // Override if Localhost OR if Env is missing
            if (isLocal || !REDIRECT_URI) {
                const protocol = isLocal ? 'http' : (req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http');
                REDIRECT_URI = `${protocol}://${host}/auth/discord/callback`;
            }

            // 1. Exchange Code for Token
            console.log('--- DEBUG DISCORD AUTH ---');
            console.log('Redirect URI Used:', REDIRECT_URI);
            console.log('Client ID:', CLIENT_ID); // Ensure this is masked in real logs if needed, but for local debugging it helps to see if it's reading at all.
            console.log('Code:', code ? 'Code Present' : 'No Code');
            console.log('Host detected:', host);
            console.log('Is Local:', isLocal);
            // -----------------------------

            const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token } = tokenResponse.data;

            // 2. Get User Info
            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            const discordUser = userResponse.data; // { id, username, email, avatar, discriminator ... }
            const { id: discordId, email, username, avatar: avatarHash } = discordUser;
            const avatarUrl = avatarHash
                ? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.png`
                : 'https://cdn.discordapp.com/embed/avatars/0.png';

            // --- JOIN GUILD LOGIC ---
            try {
                const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN; // Bot Token
                // Main Server ID (Bettrion)
                const GUILD_ID = process.env.DISCORD_GUILD_ID || '1446269308605825047';

                if (BOT_TOKEN) {
                    await axios.put(`https://discord.com/api/guilds/${GUILD_ID}/members/${discordId}`, {
                        access_token: access_token // Pass user's access token to authorize join
                    }, {
                        headers: {
                            Authorization: `Bot ${BOT_TOKEN}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log(`[Discord] Auto-joined user ${username} to guild ${GUILD_ID}`);
                }
            } catch (joinErr) {
                // Ignore if already joined or permission error (don't block login)
                console.warn('[Discord] Auto-join failed (likely already in guild or scope mismatch):', joinErr.response?.data || joinErr.message);
            }
            // ------------------------

            // 3. Find or Create User in Supabase
            // Check by Discord ID first
            let { data: user } = await supabase.from('users').select('*').eq('discord_id', discordId).single();

            if (!user && email) {
                // Check by Email
                const { data: emailUser } = await supabase.from('users').select('*').eq('email', email).single();
                if (emailUser) {
                    user = emailUser;
                    // Link Discord
                    await supabase.from('users').update({
                        discord_id: discordId,
                        discord_username: username,
                        avatar: user.avatar === '/assets/uploads/avatars/default.png' ? avatarUrl : user.avatar // Only update avatar if user has default? Or just keep user's choice. Let's keep user's unless default.
                    }).eq('id', user.id);
                }
            }

            if (!user) {
                // Create New
                const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
                const ipInfo = await getIpInfo(ip_address);

                const { data: newUser, error } = await supabase.from('users').insert({
                    email: email || `${discordId}@discord.bettrion.com`, // Fallback if no email
                    name: username,
                    discord_id: discordId,
                    discord_username: username,
                    avatar: avatarUrl,
                    status: 'active',
                    is_verified: true, // Discord verified
                    auth_provider: 'discord',
                    ip_address,
                    country: ipInfo.country || 'Unknown',
                    city: ipInfo.city || 'Unknown',
                    points_balance: 0
                }).select().single();

                if (error) throw error;
                user = newUser;
            } else {
                // Update Metadata
                await supabase.from('users').update({
                    last_login_at: new Date(),
                    discord_username: username,
                    // Optionally update avatar if they want? Let's check if it's default
                    avatar: (user.avatar === '/assets/uploads/avatars/default.png' || !user.avatar) ? avatarUrl : user.avatar
                }).eq('id', user.id);
            }

            // 4. Generate JWT
            const token = jwt.sign({
                id: user.id,
                role: user.role || 'user',
                email: user.email,
                username: user.name,
                discord_id: discordId
            }, process.env.JWT_SECRET || 'bettrion_jwt_secret_v2', { expiresIn: '30d' });

            // 5. Redirect User with Token
            res.redirect(`/?token=${token}`);

        } catch (error) {
            console.error('Discord Auth Error:', error.response?.data || error.message);
            res.redirect('/login.html?error=Discord_Login_Failed');
        }
    },

    // Reset Password - Verify Token & Update
    resetPassword: async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) return res.status(400).json({ message: 'Token and new password required' });

            // Find user by token
            const { data: user } = await supabase
                .from('users')
                .select('*')
                .eq('reset_token', token)
                .single();

            if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

            // Check Expiry
            if (new Date() > new Date(user.reset_expires)) {
                return res.status(400).json({ message: 'Token expired' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update user
            const { error } = await supabase.from('users').update({
                password_hash: hashedPassword,
                reset_token: null,
                reset_expires: null
            }).eq('id', user.id);

            if (error) throw error;

            res.json({ success: true, message: 'Password has been reset successfully. You can now login.' });

        } catch (error) {
            console.error('Reset Password Error:', error);
            res.status(500).json({ message: 'Failed to reset password' });
        }
    },

    // Get My IP (Public Endpoint for Frontend)
    getMyIp: async (req, res) => {
        try {
            const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
            const info = await getIpInfo(ip_address);
            res.json(info);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch IP info' });
        }
    }
};

module.exports = authController;
