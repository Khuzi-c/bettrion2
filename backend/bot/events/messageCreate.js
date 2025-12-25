const { Events } = require('discord.js');
const ticketSync = require('../../controllers/ticketSyncController');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore bot messages
        if (message.author.bot) return;

        // Emit to Admin Dashboard via Socket.io
        if (global.io) {
            global.io.to('admin').emit('discord_message', {
                channelId: message.channel.id,
                content: message.content,
                author: message.author.username,
                authorAvatar: message.author.displayAvatarURL(),
                timestamp: message.createdAt,
                id: message.id,
                bot: false
            });
        }

        // Ticket Logic
        // Check if channel is a ticket (starts with known prefixes)
        const isTicket = message.channel.name?.startsWith('ticket-') ||
            message.channel.name?.startsWith('support-') ||
            message.channel.name?.startsWith('report-');

        if (!isTicket) return;

        // Visual confirmation for user (optional, maybe remove if spammy)
        // if (!message.author.bot) await message.react('📨');

        try {
            // Sync Discord message to web
            await ticketSync.syncDiscordToWeb(threadId, message);

            // React to confirm sync
            await message.react('✅');
        } catch (err) {
            console.error('Error syncing Discord message to web:', err);
            await message.react('❌');
        }
    },
};
