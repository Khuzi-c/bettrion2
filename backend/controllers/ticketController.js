const { createClient } = require('@supabase/supabase-js');
const ticketSync = require('./ticketSyncController');
const ticketEmailService = require('../services/ticketEmailService');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.createTicket = async (req, res) => {
    try {
        const { user_id, guest_email, subject, category, priority, initial_message, description } = req.body;

        // Generate short_id (8 chars)
        const short_id = Math.random().toString(36).substring(2, 10).toUpperCase();

        // 1. Create Ticket Data Object
        let ticketData = {
            user_id: user_id || null, // Will be set to null if invalid
            guest_email: guest_email || null,
            short_id: short_id,
            subject,
            category,
            priority: priority || 'MEDIUM',
            status: 'OPEN'
        };

        // SAFETY: If user_id provided, verify first
        if (ticketData.user_id) {
            const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('id', ticketData.user_id);
            if (error || count === 0) {
                console.warn(`Invalid user_id ${ticketData.user_id}. Resetting to NULL/Guest.`);
                ticketData.user_id = null;
                if (!ticketData.guest_email) ticketData.guest_email = 'anonymous@guest.com';
            }
        }

        // 1. Attempt Insert
        let ticket, ticketError;

        try {
            const result = await supabase.from('tickets').insert([ticketData]).select().single();
            ticket = result.data;
            ticketError = result.error;
        } catch (err) {
            ticketError = err;
        }

        // 2. RETRY STRATEGY (Nuclear Option)
        if (ticketError && (ticketError.code === '23503' || ticketError.message?.includes('foreign key'))) {
            console.warn('⚠️ FK Violation caught on insert! Retrying as Anonymous Guest...');
            ticketData.user_id = null;
            if (!ticketData.guest_email) ticketData.guest_email = 'anonymous_retry@guest.com';

            const retryResult = await supabase.from('tickets').insert([ticketData]).select().single();
            ticket = retryResult.data;
            ticketError = retryResult.error;
        }

        if (ticketError) throw ticketError;

        // 2. Create Discord Thread (non-blocking)
        try {
            ticketSync.createDiscordThread(ticket.id, {
                subject,
                description: initial_message || subject,
                guest_email: ticketData.guest_email,
                priority: priority || 'MEDIUM',
                status: 'OPEN'
            }).catch(err => console.error('Discord thread creation failed:', err));
        } catch (discordErr) {
            console.warn('Discord sync error (ignored for ticket creation):', discordErr);
        }

        // 3. Create Initial Message
        if (initial_message) {
            const { data: message, error: msgError } = await supabase
                .from('messages')
                .insert([{
                    ticket_id: ticket.id,
                    sender_role: 'USER',
                    content: initial_message
                }])
                .select()
                .single();

            if (msgError) {
                console.error("Error creating initial message:", msgError);
            } else {
                // Sync to Discord
                const ticketSync = require('./ticketSyncController'); // Require here to avoid circular dep issues if any
                ticketSync.syncWebToDiscord(ticket.id, message).catch(err =>
                    console.error('Failed to sync message to Discord:', err)
                );
            }
        }

        // Send Email Notification to Admin
        const emailService = require('../services/emailService');
        try {
            await emailService.sendAdminNewTicket(ticket.id, subject);
        } catch (e) {
            console.error('Failed to send admin alert', e);
        }

        res.json({ success: true, data: ticket });
    } catch (err) {
        console.error("Ticket Create Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
}

exports.closeTicket = async (req, res) => {
    try {
        const { ticket_id } = req.body;

        // Update ticket status to CLOSED
        const { error } = await supabase
            .from('tickets')
            .update({ status: 'CLOSED' })
            .eq('id', ticket_id);

        if (error) throw error;

        // Update Discord thread status
        const ticketSync = require('./ticketSyncController');
        await ticketSync.updateTicketStatus(ticket_id, 'CLOSED');

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getAllTickets = async (req, res) => {
    try {
        const { user_id } = req.query; // Filter by user if provided
        let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });

        if (user_id) {
            query = query.eq('user_id', user_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getTicketMessages = async (req, res) => {
    try {
        const { ticket_id } = req.params;
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('ticket_id', ticket_id)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        console.error('getTicketMessages Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { ticket_id, sender_role, content, attachments } = req.body;
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                ticket_id,
                sender_role, // 'USER' or 'ADMIN'
                content,
                attachments: attachments || []
            }])
            .select()
            .single();

        if (error) throw error;

        // NOTIFICATION: If Admin replied, email the user
        if (sender_role === 'ADMIN') {
            ticketEmailService.sendReplyNotification(ticket_id, content).catch(err =>
                console.error('Failed to send reply notification:', err)
            );
        }

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Update ticket status (OPEN, PAUSED, CLOSED)
 */
exports.updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'OPEN', 'PAUSED', 'CLOSED'

        const { data, error } = await supabase
            .from('tickets')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Delete ticket
 */
exports.deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('tickets')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Ticket deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
