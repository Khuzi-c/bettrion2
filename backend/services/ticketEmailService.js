const emailService = require('./emailService');
const supabase = require('../config/supabase');

const ticketEmailService = {
    /**
     * Send email notification to the user when a ticket receives a reply
     */
    sendReplyNotification: async (ticketId, replyContent) => {
        try {
            // 1. Get Ticket Details
            const { data: ticket, error } = await supabase
                .from('tickets')
                .select('guest_email, user_id, subject, short_id')
                .eq('id', ticketId)
                .single();

            if (error || !ticket) {
                console.error('TicketEmailService: Ticket not found', error);
                return;
            }

            // 2. Determine Recipient Email
            let recipientEmail = ticket.guest_email;

            // If no guest email, try to fetch from User ID
            if (!recipientEmail && ticket.user_id) {
                const { data: user } = await supabase
                    .from('users')
                    .select('email')
                    .eq('id', ticket.user_id)
                    .single();

                if (user) recipientEmail = user.email;
            }

            if (!recipientEmail) {
                console.log('TicketEmailService: No email found for ticket', ticket.short_id);
                return;
            }

            // 3. Prepare Email Content
            const subject = `[Ticket #${ticket.short_id}] New Reply: ${ticket.subject}`;
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <h2 style="color: #e50914;">New Reply to your Ticket</h2>
                    <p>Hello,</p>
                    <p>You have received a new reply to your support ticket <strong>#${ticket.short_id}</strong>.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #e50914; margin: 20px 0;">
                        <strong>Admin Reply:</strong><br>
                        ${replyContent.replace(/\n/g, '<br>')}
                    </div>

                    <p>You can view the full conversation and reply by visiting the support center.</p>
                    
                    <a href="https://bettrion.com/support" style="display: inline-block; background-color: #e50914; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Ticket</a>
                    
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <small style="color: #888;">This is an automated message. Please do not reply directly to this email.</small>
                </div>
            `;

            // 4. Send Email
            await emailService.sendEmail(recipientEmail, subject, html);
            console.log(`✅ Ticket Reply Email sent to ${recipientEmail} for Ticket #${ticket.short_id}`);

        } catch (err) {
            console.error('TicketEmailService Error:', err);
        }
    }
};

module.exports = ticketEmailService;
