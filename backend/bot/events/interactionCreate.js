const { Events } = require('discord.js');
const ticketSync = require('../../controllers/ticketSyncController');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }

        // Handle button interactions
        else if (interaction.isButton()) {
            const { generateTranscript } = require('../utils/transcript');
            const config = require('../config');
            const customId = interaction.customId;

            // --- TICKET CREATION ---
            if (customId === 'btn_support' || customId === 'btn_report' || customId === 'btn_bug') {
                await interaction.deferReply({ ephemeral: true });
                const guild = interaction.guild;
                const user = interaction.user;

                let type = 'SUPPORT';
                let color = config.COLORS.SUPPORT;
                let emoji = '🎫';

                if (customId === 'btn_report') { type = 'REPORT'; color = config.COLORS.REPORT; emoji = '🛡️'; }
                if (customId === 'btn_bug') { type = 'BUG'; color = config.COLORS.BUG; emoji = '🐛'; }

                // Check if user already has an open ticket (optional)
                // const existing = guild.channels.cache.find(c => c.name === `${type.toLowerCase()}-${user.username.toLowerCase()}`);
                // if (existing) return interaction.editReply({ content: `❌ You already have an open ticket: ${existing}` });

                // Create Channel
                try {
                    const channel = await guild.channels.create({
                        name: `${emoji}-${type.toLowerCase()}-${user.username}`,
                        type: 0, // Guild Text
                        parent: config.CATEGORIES.OPEN_TICKETS,
                        permissionOverwrites: [
                            { id: guild.id, deny: ['ViewChannel'] },
                            { id: user.id, allow: ['ViewChannel', 'SendMessages', 'AttachFiles', 'ReadMessageHistory'] },
                            { id: interaction.client.user.id, allow: ['ViewChannel', 'SendMessages'] }
                            // Add Staff Role if exists
                        ]
                    });

                    if (config.ROLES.STAFF) {
                        channel.permissionOverwrites.create(config.ROLES.STAFF, {
                            ViewChannel: true,
                            SendMessages: true
                        });
                    }

                    await interaction.editReply({ content: `✅ Ticket Created: ${channel}` });

                    // Initial Message
                    const controlRow = {
                        type: 1,
                        components: [
                            { type: 2, label: "Claim", style: 3, custom_id: `ticket_claim_${channel.id}`, emoji: '✋' },
                            { type: 2, label: "Close", style: 2, custom_id: `ticket_close_${channel.id}`, emoji: '🔒' },
                            { type: 2, label: "Delete", style: 4, custom_id: `ticket_delete_${channel.id}`, emoji: '🗑️' }
                        ]
                    };

                    await channel.send({
                        content: `<@${user.id}> Welcome to **Bettrion Support**!`,
                        embeds: [{
                            title: `${emoji} ${type} TICKET`,
                            description: `Hi <@${user.id}>,\n\nThanks for reaching out! Please describe your issue in detail.\n\n**Category**: ${type}\n**User**: ${user.tag} (${user.id})`,
                            color: color,
                            timestamp: new Date(),
                            footer: { text: "Bettrion Support System" }
                        }],
                        components: [controlRow]
                    });

                    // Track in DB
                    try {
                        const { data, error } = await supabase.from('tickets').insert([{
                            user_id: null, // Web User ID is unknown here
                            discord_user_id: user.id, // Track Discord User
                            subject: `${type} - ${user.username}`,
                            status: 'OPEN',
                            priority: 'MEDIUM',
                            category: type,
                            discord_channel_id: channel.id,
                            discord_thread_id: channel.id // Using channel as thread ID for consistency in sync logic
                        }]);

                        // Map it
                        await supabase.from('ticket_discord_mapping').insert({
                            discord_thread_id: channel.id,
                            discord_channel_id: channel.id
                        });

                    } catch (e) { console.error("DB Insert Error", e); }

                } catch (e) {
                    console.error(e);
                    await interaction.editReply({ content: "❌ Failed to create ticket channel. Check bot permissions or Category ID." });
                }
                return;
            }

            // --- TICKET ACTIONS ---
            const parts = customId.split('_');
            const action = parts[0];
            const subAction = parts[1];

            if (action === 'ticket') {
                try {
                    const channel = interaction.channel;

                    if (subAction === 'delete') {
                        await interaction.reply("🗑️ **Deleting Ticket...** Generating Transcript.");

                        // 1. Generate Transcript
                        let transcriptFile = null;
                        try {
                            const messages = await channel.messages.fetch({ limit: 100 });
                            const filename = await generateTranscript(channel, messages);
                            const path = require('path');
                            transcriptFile = path.join(__dirname, '../../data/transcripts', filename);
                        } catch (e) { console.error("Transcript Gen Error", e); }

                        // 2. DM User
                        if (transcriptFile) {
                            // Find the user (parse from channel topic or just search for the non-bot user permissions? Hard to guess. 
                            // Easier: The user who clicked 'delete' might be admin. 
                            // We stored discord_user_id in DB, let's fetch it.)
                            try {
                                const { data: ticket } = await supabase.from('tickets').select('discord_user_id').eq('discord_channel_id', channel.id).single();
                                if (ticket && ticket.discord_user_id) {
                                    const ticketUser = await interaction.client.users.fetch(ticket.discord_user_id);
                                    if (ticketUser) {
                                        await ticketUser.send({
                                            content: `📪 **Ticket Closed: ${channel.name}**\nHere is your transcript.`,
                                            files: [transcriptFile]
                                        }).catch(() => { });
                                    }
                                }
                            } catch (e) { console.log('DM Fail', e); }
                        }

                        // 3. Log Channel
                        if (config.CHANNELS.TRANSCRIPTS && transcriptFile) {
                            try {
                                const logChan = await interaction.guild.channels.fetch(config.CHANNELS.TRANSCRIPTS);
                                if (logChan) {
                                    await logChan.send({
                                        content: `📑 **Ticket Deleted**: ${channel.name}\n**Deleted By**: ${interaction.user.tag}`,
                                        files: [transcriptFile]
                                    });
                                }
                            } catch (e) { }
                        }

                        // 4. Delete Channel
                        setTimeout(() => channel.delete().catch(() => null), 3000);

                    } else if (subAction === 'close') {
                        // Move to Archive logic (Keep as is but add visual feedback)
                        await interaction.reply("🔒 **Archiving Ticket...**");
                        if (config.CATEGORIES.ARCHIVED_TICKETS) {
                            await channel.setParent(config.CATEGORIES.ARCHIVED_TICKETS, { lockPermissions: false });
                        }
                        await channel.setName(`closed-${channel.name}`);

                        await interaction.channel.send({
                            embeds: [{ description: "Ticket Archived. Use **Delete** to permanently remove.", color: 0xFFA500 }]
                        });

                    } else if (subAction === 'claim') {
                        await interaction.reply({
                            content: `👮‍♂️ Ticket claimed by <@${interaction.user.id}>`,
                            embeds: [{ description: "Support agent is now assisting you.", color: 0x2ECC71 }]
                        });
                    }
                } catch (err) {
                    console.error('Error handling ticket button:', err);
                    if (!interaction.replied) await interaction.reply({ content: '❌ Error processing action', ephemeral: true });
                }
            }
        }
    },
};
