const nodemailer = require('nodemailer');
const supabase = require('../config/supabase');
const emailTemplates = require('./emailTemplates');
require('dotenv').config();

// Configure Transporter
// Configure Transporter
let transporter;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const isGmail = !process.env.EMAIL_HOST; // If no host provided, assume Gmail

    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 465,
        secure: process.env.EMAIL_SECURE === 'true' || (process.env.EMAIL_PORT == 465), // true for 465, false for other ports
        service: isGmail ? 'gmail' : undefined,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    console.log(`📧 Configured Email Service: ${isGmail ? 'Gmail' : process.env.EMAIL_HOST}`);
} else {
    // MOCK Transporter for Dev - logs to console instead of crashing
    console.log('⚠️  EMAIL_USER/PASS missing. Using Mock Emailer (logs to console).');
    transporter = {
        sendMail: async (mailOptions) => {
            console.log('📧  [MOCK EMAIL] To:', mailOptions.to);
            console.log('📧  [MOCK EMAIL] Subject:', mailOptions.subject);
            console.log('📧  [MOCK EMAIL] Content:', mailOptions.html ? '(HTML Content)' : mailOptions.text);
            return { messageId: 'mock-' + Date.now() };
        }
    };
}

const emailService = {
    // 1. Send Welcome Email (Auto on Signup)
    sendWelcomeEmail: async (email, name) => {
        const { subject, html } = emailTemplates.welcome(name);
        return emailService.sendEmail(email, subject, html);
    },

    // 2. Core Send Function (Logs to DB)
    // 2. Core Send Function (Logs to DB)
    sendEmail: async (to, subject, html) => {
        const mailOptions = {
            from: '"Bettrion Support" <' + (process.env.EMAIL_USER || 'no-reply@bettrion.com') + '>',
            to: to,
            subject: subject,
            html: html
        };

        try {
            // Send via Nodemailer (or Mock)
            // We use a nested try-catch to handle Auth errors specifically without failing the whole request
            let info;
            try {
                info = await transporter.sendMail(mailOptions);
                console.log('Email Sent:', info.messageId);
            } catch (sendErr) {
                // If invalid credentials (EAUTH), fallback to mock
                if (sendErr.code === 'EAUTH' || sendErr.responseCode === 535) {
                    console.log('⚠️  SMTP Auth Failed (Invalid Password). Falling back to Mock Sender.');
                    console.log('📧  [MOCK EMAIL] To:', to);
                    console.log('📧  [MOCK EMAIL] Subject:', subject);
                    console.log('📧  [MOCK EMAIL] Content:', '(HTML Content)');
                    info = { messageId: 'mock-fallback-' + Date.now() };
                } else {
                    throw sendErr; // Throw other errors (connection, dns, etc)
                }
            }

            // Log to Supabase (if table exists)
            try {
                await supabase.from('sent_emails').insert({
                    to_email: to,
                    subject: subject,
                    body: html,
                    status: 'sent'
                });
            } catch (dbErr) {
                // Ignore DB logging error if table missing
            }

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Email Send Error:', error);

            // Log Failure
            try {
                await supabase.from('sent_emails').insert({
                    to_email: to,
                    subject: subject,
                    body: html,
                    status: 'failed',
                    error_message: error.message
                });
            } catch (dbErr) { }

            throw error;
        }
    },

    // 3. Subscribe User
    subscribeUser: async (email, name) => {
        // Check if exists
        const { data: existing } = await supabase.from('subscribers').select('id').eq('email', email).single();

        if (existing) {
            return { message: 'Already subscribed' };
        }

        // Add to DB
        const { data, error } = await supabase.from('subscribers').insert({
            email,
            name
        }).select().single();

        if (error) throw error;

        // Auto Send Welcome
        // Don't await strictly if we want faster response, but better for error handling
        await emailService.sendWelcomeEmail(email, name);

        return data;
    },
    // --- Admin Alerts ---
    sendAdminNewTicket: async (ticketId, subject) => {
        const { subject: subj, html } = emailTemplates.adminNewTicket(ticketId, subject);
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER; // Fallback to sender
        if (adminEmail) return emailService.sendEmail(adminEmail, subj, html);
    },

    sendAdminNewUser: async (userEmail) => {
        const { subject, html } = emailTemplates.adminNewUser(userEmail);
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        if (adminEmail) return emailService.sendEmail(adminEmail, subject, html);
    }
};

module.exports = emailService;
