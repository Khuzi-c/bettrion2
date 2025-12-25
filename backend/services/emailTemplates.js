const emailTemplates = {

    // --- HELPER: Base Template Wrapper (4-Column Footer) ---
    baseTemplate: (contentHtml) => {
        const year = new Date().getFullYear();
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bettrion</title>
            <style>
                body { margin: 0; padding: 0; background-color: #f0f0f0; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #333; }
                .email-wrapper { max-width: 680px; margin: 0 auto; background-color: #ffffff; }
                .email-header { background-color: #000000; padding: 25px; text-align: center; border-bottom: 3px solid #e50914; }
                .email-body { padding: 40px 30px; line-height: 1.6; color: #444; font-size: 16px; }
                
                /* Footer Styles (Inline-friendly) */
                .email-footer { background-color: #000000; color: #888888; padding: 40px 20px; font-size: 13px; }
                .footer-heading { color: #ffffff; font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; margin-top: 0; }
                .footer-link { color: #888888; text-decoration: none; display: block; margin-bottom: 8px; transition: color 0.2s; }
                .footer-link:hover { color: #ffffff; }
                .social-icon { width: 24px; height: 24px; margin-right: 10px; opacity: 0.7; }
                
                /* Buttons & Cards */
                .btn-primary { display: inline-block; background-color: #e50914; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0; }
                .info-card { background: #f9f9f9; border-left: 4px solid #e50914; padding: 15px; margin: 20px 0; font-size: 14px; }
                h1 { font-size: 24px; color: #111; margin-top: 0; }
                h2 { font-size: 20px; color: #111; margin-top: 0; }
                
                @media only screen and (max-width: 600px) {
                    .footer-col { width: 100% !important; display: block !important; margin-bottom: 30px !important; }
                    .email-body { padding: 20px !important; }
                }
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <!-- HEADER -->
                <div class="email-header">
                    <a href="https://bettrion.com">
                        <img src="https://bettrion.com/assets/img/logo.webp" alt="BETTRION" width="150" style="display: block; margin: 0 auto;">
                    </a>
                </div>

                <!-- CONTENT -->
                <div class="email-body">
                    ${contentHtml}
                </div>

                <!-- 4-COLUMN FOOTER (Table Layout for Email Clients) -->
                <div class="email-footer">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                        <tr>
                            <!-- Column 1: Brand -->
                            <td class="footer-col" width="30%" valign="top" style="padding-right: 20px;">
                                <img src="https://bettrion.com/assets/img/logo.webp" alt="Bettrion" width="100" style="margin-bottom: 15px;">
                                <p style="line-height: 1.5; margin-bottom: 15px;">Exclusive Casino Bonuses & Reviews.<br>The #1 Trusted Source.</p>
                                <div>
                                    <a href="https://discord.gg/bettrion"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg" class="social-icon" style="filter: invert(1);"></a>
                                    <a href="https://instagram.com/bettrion"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg" class="social-icon" style="filter: invert(1);"></a>
                                    <a href="https://youtube.com/@bettrion"><img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg" class="social-icon" style="filter: invert(1);"></a>
                                </div>
                            </td>

                            <!-- Column 2: Platform -->
                            <td class="footer-col" width="20%" valign="top">
                                <h4 class="footer-heading">Platform</h4>
                                <a href="https://bettrion.com/about.html" class="footer-link">About Us</a>
                                <a href="https://bettrion.com/contact.html" class="footer-link">Contact</a>
                                <a href="https://bettrion.com/sitemap.xml" class="footer-link">Sitemap</a>
                            </td>

                            <!-- Column 3: Safety -->
                            <td class="footer-col" width="20%" valign="top">
                                <h4 class="footer-heading">Safety</h4>
                                <a href="https://bettrion.com/responsible-gambling.html" class="footer-link">Responsible Gambling</a>
                                <a href="https://bettrion.com/legal.html" class="footer-link">Terms & Privacy</a>
                            </td>

                            <!-- Column 4: Newsletter (Text Version) -->
                            <td class="footer-col" width="30%" valign="top">
                                <h4 class="footer-heading">Stay Updated</h4>
                                <p style="margin-top: 0; line-height: 1.5; margin-bottom: 15px;">Get the latest bonuses delivered to your inbox.</p>
                                <a href="https://bettrion.com/subscribe" style="color: #e50914; font-weight: bold; text-decoration: none;">Manage Preferences &rarr;</a>
                            </td>
                        </tr>
                    </table>

                    <!-- Divider -->
                    <div style="height: 1px; background: #333; margin: 30px 0 20px;"></div>

                    <!-- Bottom -->
                    <table width="100%">
                        <tr>
                            <td align="left" style="color: #666; font-size: 11px;">
                                &copy; ${year} Bettrion.com. All rights reserved. Prices and offers subject to change.
                            </td>
                            <td align="right" style="font-size: 11px;">
                                <a href="https://bettrion.com/unsubscribe" style="color: #666; text-decoration: underline;">Unsubscribe</a>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>
        </body>
        </html>
        `;
    },

    // --- TEMPLATES ---

    welcome: (name) => {
        const userName = name || 'Friend';
        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        return {
            subject: 'Welcome to Bettrion Premium',
            html: emailTemplates.baseTemplate(`
                <h1 style="text-align: center;">Welcome, ${userName}!</h1>
                <p style="text-align: center; font-size: 18px; color: #666; margin-bottom: 30px;">Your account is now active.</p>
                
                <table width="100%" cellpadding="15" cellspacing="0" style="background: #f9f9f9; border: 1px solid #eee; margin-bottom: 30px;">
                    <tr>
                        <td align="center">
                            <strong>Member Since</strong><br>
                            <span style="color: #e50914;">${date}</span>
                        </td>
                        <td align="center" style="border-left: 1px solid #ddd;">
                            <strong>Account Status</strong><br>
                            <span style="color: #27ae60;">Verified</span>
                        </td>
                        <td align="center" style="border-left: 1px solid #ddd;">
                            <strong>Access Level</strong><br>
                            <span>Standard</span>
                        </td>
                    </tr>
                </table>

                <p>We're thrilled to have you on board. Bettrion connects you with the most trusted casinos and exclusive bonuses in the industry.</p>
                
                <div class="info-card">
                    <strong>🚀 Quick Start Tip:</strong> Verify your email to unlock our complete list of "No-Deposit" bonuses.
                </div>

                <div style="text-align: center;">
                    <a href="https://bettrion.com/casinos.html" class="btn-primary">Explore Top Casinos</a>
                </div>
            `)
        };
    },

    newReview: (casinoName, casinoSlug) => {
        return {
            subject: `New Review: ${casinoName}`,
            html: emailTemplates.baseTemplate(`
                <div style="text-align: center;">
                    <span style="background: #e50914; color: white; padding: 4px 8px; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; border-radius: 2px;">New Audit</span>
                </div>
                <h1 style="text-align: center; margin-top: 10px;">${casinoName} Review</h1>
                
                <p>Our team regarding <strong>${casinoName}</strong> is complete. We've analyzed the RTP, withdrawal speeds, and license validity.</p>
                
                <div style="background: #fff; border: 1px solid #ddd; padding: 20px; margin: 20px 0; text-align: center;">
                    <h3 style="margin: 0 0 10px;">Audit Score</h3>
                    <div style="font-size: 32px; font-weight: bold; color: #27ae60;">96/100</div>
                    <p style="margin: 5px 0 0; color: #888; font-size: 12px;">"Highly Recommended"</p>
                </div>

                <div style="text-align: center;">
                    <a href="https://bettrion.com/casinos/${casinoSlug}" class="btn-primary">Read Full Analysis</a>
                </div>
            `)
        };
    },

    adminNewTicket: (ticketId, subject) => {
        return {
            subject: `Admin Alert: New Ticket #${ticketId}`,
            html: emailTemplates.baseTemplate(`
                <h2 style="color:#c0392b;">🎫 Support Request Received</h2>
                
                <div style="background:#f4f4f4; padding:20px; border-radius:4px; margin-bottom:20px;">
                    <p style="margin:0;"><strong>Ticket ID:</strong> #${ticketId}</p>
                    <p style="margin:10px 0 0;"><strong>Subject:</strong> ${subject}</p>
                </div>

                <p>A user requires assistance. Please reply within 24 hours to maintain SLA.</p>

                <div style="text-align: center;">
                    <a href="https://bettrion.com/admin/tickets.html" class="btn-primary" style="background-color: #333;">Open Admin Panel</a>
                </div>
            `)
        };
    },

    adminNewUser: (email) => {
        return {
            subject: 'Admin Alert: New Registration',
            html: emailTemplates.baseTemplate(`
                <h2 style="color:#2980b9;">👤 New Player Joined</h2>
                <p><strong>Email:</strong> ${email}</p>
                <p>A new user has successfully registered on the platform.</p>
                
                <div style="text-align: center;">
                    <a href="https://bettrion.com/admin/users.html" class="btn-primary" style="background-color: #333;">Manage Users</a>
                </div>
            `)
        };
    }
};

module.exports = emailTemplates;
