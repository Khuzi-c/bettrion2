const { client } = require('../bot/bot');

// Notification channels (configure in .env)
const ANNOUNCEMENT_CHANNEL_ID = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID;
const ADMIN_LOG_CHANNEL_ID = process.env.DISCORD_ADMIN_LOG_CHANNEL_ID;

// Send notification to announcement channel
exports.notifyNewCasino = async (casinoData) => {
    try {
        if (!ANNOUNCEMENT_CHANNEL_ID) return;

        const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);
        if (!channel) return;

        await channel.send({
            embeds: [{
                color: 0xf6d56a,
                title: '🎰 New Casino Added!',
                description: `**${casinoData.name}** is now available on Bettrion!`,
                fields: [
                    { name: '⭐ Rating', value: `${casinoData.rating}/5.0`, inline: true },
                    { name: '🔗 Link', value: `[Play Now](https://bettrion.com/casinos/${casinoData.slug})`, inline: true }
                ],
                thumbnail: { url: casinoData.logo || 'https://via.placeholder.com/200' },
                timestamp: new Date()
            }]
        });

        console.log(`✅ Sent new casino notification: ${casinoData.name}`);
    } catch (err) {
        console.error('Error sending casino notification:', err);
    }
};

// Notify staff of new ticket
exports.notifyNewTicket = async (ticketId, ticketData) => {
    try {
        const staffRoleId = process.env.DISCORD_STAFF_ROLE_ID;
        const supportChannelId = process.env.DISCORD_SUPPORT_CHANNEL_ID;

        if (!supportChannelId) return;

        const channel = await client.channels.fetch(supportChannelId);
        if (!channel) return;

        await channel.send({
            content: staffRoleId ? `<@&${staffRoleId}> New support ticket!` : '🎫 New support ticket!',
            embeds: [{
                color: 0xf59e0b,
                title: `🎫 New Ticket #${ticketId.substring(0, 8)}`,
                description: ticketData.description || 'No description',
                fields: [
                    { name: '📧 Email', value: ticketData.guest_email || 'N/A', inline: true },
                    { name: '⚡ Priority', value: ticketData.priority || 'MEDIUM', inline: true },
                    { name: '📝 Subject', value: ticketData.subject || 'No subject', inline: false }
                ],
                timestamp: new Date()
            }]
        });

        console.log(`✅ Sent new ticket notification: ${ticketId}`);
    } catch (err) {
        console.error('Error sending ticket notification:', err);
    }
};

// Notify user of ticket reply
exports.notifyTicketReply = async (ticketId, userId, message) => {
    try {
        // Get Discord thread for ticket
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

        const { data: mapping } = await supabase
            .from('ticket_discord_mapping')
            .select('discord_thread_id')
            .eq('ticket_id', ticketId)
            .single();

        if (!mapping || !mapping.discord_thread_id) return;

        const thread = await client.channels.fetch(mapping.discord_thread_id);
        if (!thread) return;

        // Ping in thread
        await thread.send({
            content: `📬 New reply from ${message.sender_role === 'USER' ? 'user' : 'staff'}`,
            embeds: [{
                color: 0x3b82f6,
                description: message.content,
                timestamp: new Date()
            }]
        });

        console.log(`✅ Sent ticket reply notification: ${ticketId}`);
    } catch (err) {
        console.error('Error sending reply notification:', err);
    }
};

// Log admin action
exports.logAdminAction = async (action, details) => {
    try {
        if (!ADMIN_LOG_CHANNEL_ID) return;

        const channel = await client.channels.fetch(ADMIN_LOG_CHANNEL_ID);
        if (!channel) return;

        await channel.send({
            embeds: [{
                color: 0x6b7280,
                title: '📋 Admin Action',
                description: action,
                fields: details ? [{ name: 'Details', value: details }] : [],
                timestamp: new Date()
            }]
        });
    } catch (err) {
        console.error('Error logging admin action:', err);
    }
};

// Notify maintenance mode change
exports.notifyMaintenanceMode = async (enabled, changedBy) => {
    try {
        if (!ADMIN_LOG_CHANNEL_ID) return;

        const channel = await client.channels.fetch(ADMIN_LOG_CHANNEL_ID);
        if (!channel) return;

        await channel.send({
            embeds: [{
                color: enabled ? 0xef4444 : 0x10b981,
                title: enabled ? '🚧 Maintenance Mode Enabled' : '✅ Maintenance Mode Disabled',
                description: `Website is now ${enabled ? 'in maintenance mode' : 'live'}`,
                fields: [
                    { name: 'Changed By', value: changedBy || 'System' }
                ],
                timestamp: new Date()
            }]
        });
    } catch (err) {
        console.error('Error sending maintenance notification:', err);
    }
};
