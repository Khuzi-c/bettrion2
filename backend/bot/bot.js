const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// Initialize commands collection
client.commands = new Collection();

// Track bot ready state
let botReady = false;

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Loaded command: ${command.data.name}`);
        }
    }
}

// Load event handlers
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`✅ Loaded event: ${event.name}`);
    }
}

client.once(Events.ClientReady, () => {
    botReady = true;
    console.log(`Bot is Ready: ${client.user.tag}`);

    // Set initial status
    client.user.setPresence({
        status: 'dnd',
        activities: [{
            name: 'bettrion.com',
            type: 3 // Watching
        }]
    });

    // Rotating status messages
    const statuses = [
        { name: 'bettrion.com', type: 3 }, // Watching
        { name: 'discord.gg/bettrion', type: 0 }, // Playing
        { name: '🎰 Casino Reviews', type: 3 }, // Watching
        { name: '💬 Support Tickets', type: 3 }, // Watching
        { name: '🎲 Best Casinos', type: 2 }, // Listening
        { name: '⭐ Top Rated Games', type: 3 }, // Watching
        { name: '🔥 New Bonuses', type: 3 }, // Watching
        { name: '💎 VIP Rewards', type: 3 }, // Watching
        { name: '🎁 Daily Offers', type: 3 }, // Watching
        { name: '📊 Live Stats', type: 3 } // Watching
    ];

    let currentIndex = 0;

    // Change status every 10 seconds
    setInterval(() => {
        currentIndex = (currentIndex + 1) % statuses.length;
        client.user.setPresence({
            status: 'dnd',
            activities: [statuses[currentIndex]]
        });
    }, 10000); // 10 seconds
});

// Helper to check if bot is ready
client.isBotReady = () => botReady;

// API Method to Send Announcement
client.sendAnnouncement = async (channelId, embedData, legacyColor) => {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return { success: false, message: 'Channel not found' };
        if (!channel.isTextBased()) return { success: false, message: 'Channel is not text-based' };

        // Handle legacy string input if necessary
        let finalData = embedData;
        if (typeof embedData === 'string') {
            finalData = { description: embedData, color: legacyColor || '#f6d56a' };
        }

        const { title, description, color, image, url, footer, plainText } = finalData;

        const embed = {
            title: title || null,
            description: description,
            color: parseInt((color || '#f6d56a').replace('#', ''), 16),
            image: image ? { url: image } : null,
            url: url || null,
            timestamp: new Date(),
            footer: { text: footer || 'Bettrion Announcement' }
        };

        await channel.send({
            content: plainText || null,
            embeds: [embed]
        });
        return { success: true };
    } catch (error) {
        console.error('Bot Announcement Error:', error);
        return { success: false, message: error.message };
    }
};

client.postReferralHype = async (newUserName, affiliateName) => {
    try {
        let channel = null;
        if (process.env.DISCORD_REFERRAL_CHANNEL) {
            try { channel = await client.channels.fetch(process.env.DISCORD_REFERRAL_CHANNEL); } catch (e) { }
        }

        // Fallback search
        if (!channel) {
            channel = client.channels.cache.find(c => c.name.includes('referral') || c.name.includes('general') || c.type === 0);
        }

        if (!channel) return { success: false, message: 'No Channel' };

        await channel.send({
            content: `🚀 **New Player Verification!**`,
            embeds: [{
                title: "Welcome to the High Rollers! 🎰",
                description: `**${newUserName}** just verified their account!`,
                color: 0x00FF00,
                fields: affiliateName ? [{ name: 'Brought in by', value: `👑 **${affiliateName}**`, inline: true }] : [],
                footer: { text: "Bettrion Live Feed" },
                timestamp: new Date(),
                thumbnail: { url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }
            }]
        });
        return { success: true };

    } catch (e) { console.error('Hype Error:', e); return { success: false }; }
};

client.postNews = async (data) => {
    try {
        let channel = null;
        if (process.env.DISCORD_NEWS_CHANNEL) {
            try { channel = await client.channels.fetch(process.env.DISCORD_NEWS_CHANNEL); } catch (e) { }
        }
        if (!channel) channel = client.channels.cache.find(c => c.name.includes('news') || c.name.includes('announce'));

        if (!channel) return { success: false, message: 'No News Channel' };

        await channel.send({
            content: `🎰 **New Slot Alert!** @everyone`,
            embeds: [{
                title: `New Drop: ${data.name} 🎰`,
                description: data.description ? data.description.substring(0, 200) + '...' : `Check out **${data.name}** by ${data.provider}!`,
                color: 0xFFD700,
                image: { url: data.logo },
                fields: [
                    { name: 'Provider', value: data.provider || 'Unknown', inline: true },
                    { name: 'Rating', value: `${data.rating}/10`, inline: true }
                ],
                url: data.affiliate_link,
                footer: { text: "Bettrion Casino News" },
                timestamp: new Date()
            }],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 5,
                            label: "Play Now 🚀",
                            url: data.affiliate_link
                        }
                    ]
                }
            ]
        });
        return { success: true };
    } catch (e) { console.error('News Error:', e); return { success: false }; }
};

// --- Advanced Management Methods ---

client.getGuildStats = async (guildId) => {
    try {
        const guild = await client.guilds.fetch(guildId);
        if (!guild) return { success: false, message: 'Guild not found' };
        return {
            success: true,
            data: {
                name: guild.name,
                memberCount: guild.memberCount,
                boostLevel: guild.premiumTier,
                iconURL: guild.iconURL()
            }
        };
    } catch (e) { return { success: false, message: e.message }; }
};

client.fetchAuditLogs = async (guildId, limit = 10) => {
    try {
        const guild = await client.guilds.fetch(guildId);
        if (!guild) return { success: false, message: 'Guild not found' };
        const logs = await guild.fetchAuditLogs({ limit });
        return {
            success: true,
            data: logs.entries.map(e => ({
                action: e.action,
                executor: e.executor?.tag,
                target: e.target?.tag || e.target?.id,
                reason: e.reason,
                createdAt: e.createdAt,
                id: e.id
            }))
        };
    } catch (e) { return { success: false, message: e.message }; }
};

client.kickMember = async (guildId, userId, reason) => {
    try {
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId);
        if (!member) return { success: false, message: 'Member not found' };
        if (!member.kickable) return { success: false, message: 'Bot cannot kick (Hierarchy)' };
        await member.kick(reason);
        return { success: true };
    } catch (e) { return { success: false, message: e.message }; }
};

client.banMember = async (guildId, userId, reason) => {
    try {
        const guild = await client.guilds.fetch(guildId);
        await guild.members.ban(userId, { reason });
        return { success: true };
    } catch (e) { return { success: false, message: e.message }; }
};

// --- Management ---

client.getChannels = async (guildId) => {
    try {
        const guild = await client.guilds.fetch(guildId);
        if (!guild) return { success: false };
        const channels = await guild.channels.fetch();
        return {
            success: true,
            data: channels.map(c => ({
                id: c.id,
                name: c.name,
                type: c.type,
                parentId: c.parentId
            })).sort((a, b) => a.type - b.type)
        };
    } catch (e) { return { success: false, error: e.message }; }
};

client.sendVerificationDM = async (targetId, code) => {
    try {
        // Try searching by ID first
        let user = null;
        try { user = await client.users.fetch(targetId); } catch (e) { }

        if (!user) return { success: false, message: 'User not found in Discord' };

        await user.send({
            embeds: [{
                title: "🔐 Link Your Account",
                description: `Use the code below to verify your identity on **Bettrion**:\n\n# ||${code}||\n\n*Click the black box to reveal.*`,
                color: 0x5865F2,
                footer: { text: "Do not share this code." }
            }]
        });
        return { success: true };
    } catch (e) { return { success: false, error: 'Cannot DM User (Privacy Settings?)' }; }
};

client.sendPayoutAlert = async (data) => {
    try {
        const channelId = process.env.DISCORD_ADMIN_CHANNEL || '1448410901899382857';
        const channel = await client.channels.fetch(channelId);
        if (!channel) return;

        await channel.send({
            content: `💸 **New Withdrawal Request**`,
            embeds: [{
                title: "Crypto Payout Pending",
                color: 0xFFA500,
                fields: [
                    { name: "User", value: data.username, inline: true },
                    { name: "Amount", value: `$${data.amount}`, inline: true },
                    { name: "Network", value: data.method, inline: true },
                    { name: "Wallet Address", value: `\`${data.wallet}\`` }
                ],
                timestamp: new Date(),
                footer: { text: "Check Admin Panel to Approve" }
            }]
        });
    } catch (e) { console.error("Payout Alert Error", e); }
};

client.getRoles = async (guildId) => {
    try {
        const guild = await client.guilds.fetch(guildId);
        const roles = await guild.roles.fetch();
        return {
            success: true,
            data: roles.map(r => ({
                id: r.id,
                name: r.name,
                color: r.hexColor,
                position: r.position
            })).sort((a, b) => b.position - a.position)
        };
    } catch (e) { return { success: false, error: e.message }; }
};

client.getHistory = async (channelId, limit = 50) => {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) return { success: false, error: 'Invalid Channel' };
        const messages = await channel.messages.fetch({ limit });
        return {
            success: true,
            data: messages.map(m => ({
                id: m.id,
                content: m.content,
                author: m.author.username,
                authorAvatar: m.author.displayAvatarURL(),
                timestamp: m.createdAt,
                bot: m.author.bot,
                embeds: m.embeds
            })).reverse()
        };
    } catch (e) { return { success: false, error: e.message }; }
};

client.manageChannel = async (guildId, action, data) => {
    try {
        const guild = await client.guilds.fetch(guildId);
        if (action === 'create') {
            await guild.channels.create({ name: data.name, type: 0 }); // Type 0 = Text
        } else if (action === 'delete') {
            const ch = await guild.channels.fetch(data.id);
            if (ch) await ch.delete();
        }
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
};

client.manageRole = async (guildId, action, data) => {
    try {
        const guild = await client.guilds.fetch(guildId);
        if (action === 'create') {
            await guild.roles.create({ name: data.name, color: data.color });
        } else if (action === 'delete') {
            const r = await guild.roles.fetch(data.id);
            if (r) await r.delete();
        }
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
};

client.getMemberDetails = async (guildId, query) => {
    try {
        const guild = await client.guilds.fetch(guildId);
        let member = null;
        // Try direct fetch (ID)
        if (query.match(/^\d+$/)) {
            try { member = await guild.members.fetch(query); } catch (e) { }
        }

        // Search by username if not found
        if (!member) {
            const members = await guild.members.search({ query });
            member = members.first();
        }

        if (!member) return { success: false, message: 'Not found in Discord' };

        return {
            success: true,
            data: {
                id: member.id,
                username: member.user.username,
                joinedAt: member.joinedAt,
                createdAt: member.user.createdAt,
                roles: member.roles.cache.map(r => r.name).filter(n => n !== '@everyone'),
                avatar: member.user.displayAvatarURL()
            }
        };
    } catch (e) { return { success: false, error: e.message }; }
};

client.banMember = async (guildId, userId, reason) => {
    try {
        const guild = await client.guilds.fetch(guildId);
        await guild.members.ban(userId, { reason });
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
};

client.sendDM = async (userId, content) => {
    try {
        const user = await client.users.fetch(userId);
        if (!user) return { success: false, message: 'User not found' };
        await user.send(content);
        return { success: true };
    } catch (e) { return { success: false, message: 'Cannot DM (Privacy/Blocked)' }; }
};

client.getMemberDetails = async (guildId, userId) => {
    try {
        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(userId);
        if (!member) return { success: false, message: 'Member not found' };
        return {
            success: true,
            data: {
                tag: member.user.tag,
                id: member.id,
                joinedAt: member.joinedAt,
                avatarURL: member.user.displayAvatarURL(),
                roles: member.roles.cache.map(r => r.name).filter(n => n !== '@everyone')
            }
        };
    } catch (e) { return { success: false, message: e.message }; }
};

if (process.env.DISCORD_BOT_TOKEN) {
    client.login(process.env.DISCORD_BOT_TOKEN).catch(e => console.error("Bot Login Failed:", e));
}

client.createTicketPanel = async (channelId) => {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return { success: false, message: 'Channel not found' };

        const config = require('./config');

        await channel.send({
            embeds: [{
                title: "Contact Support",
                description: "Please choose the appropriate button below to open a ticket.\n\n**Support**\nClick receiving help with general inquiries.\n\n**Report**\nClick to report a user or issue.\n\n**Bug Report**\nClick to report a technical bug.",
                color: 0x2b2d31,
                image: { url: 'https://cdn.discordapp.com/attachments/11111111111/Bettrion_Support_Discord.png' }, // Placeholder for the image in user screenshot, using generic or description prompt if I had one. 
                // User provided an image upload. I should try to use a valid URL if I can, but I'll stick to a generic banner or just the text.
                // The user's image shows a banner "BETTRION SUPPORT DISCORD".
                // I will use a local attachment or just leave the text for now.
                footer: { text: "Bettrion Support | Your satisfaction matters." }
            }],
            components: [{
                type: 1,
                components: [
                    { type: 2, label: "Support", style: 1, custom_id: "btn_support", emoji: "🎫" },
                    { type: 2, label: "Report", style: 4, custom_id: "btn_report", emoji: "🛡️" },
                    { type: 2, label: "Bug Report", style: 2, custom_id: "btn_bug", emoji: "🐛" }
                ]
            }]
        });
        return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
};

const { createBackup, loadBackups, restoreBackup } = require('./utils/backupSystem');

client.loadBackups = loadBackups;

client.restoreBackup = async (guildId, backupId) => {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return { success: false, message: 'Guild not found' };
    return await restoreBackup(guild, backupId);
};

// Auto-Backup Scheduler (Every 12 Hours)
setInterval(async () => {
    try {
        const guildId = '1446269308605825047'; // Main Guild ID
        const guild = client.guilds.cache.get(guildId);
        if (guild) {
            console.log('[Auto-Backup] Triggering...');
            await createBackup(guild);
        }
    } catch (e) { console.error('[Auto-Backup] Failed:', e); }
}, 12 * 60 * 60 * 1000);

const config = require('./config');

// Auto Welcome
client.on('guildMemberAdd', async (member) => {
    try {
        if (!config.CHANNELS.WELCOME) return;
        const channel = await member.guild.channels.fetch(config.CHANNELS.WELCOME);
        if (!channel) return;

        // Custom Welcome Image or Embed
        await channel.send({
            content: `🎉 Welcome to **Bettrion**, ${member}!`,
            embeds: [{
                title: "Welcome to the Community! 🎰",
                description: "Make sure to read the rules and verify your account.",
                color: config.COLORS.SUCCESS,
                image: { url: 'https://cdn.discordapp.com/attachments/111/welcome_banner.png' }, // Placeholder
                footer: { text: `User #${member.guild.memberCount}` },
                timestamp: new Date()
            }]
        });
    } catch (e) { console.error('Welcome Error:', e); }
});

// Panel Command
client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    if (msg.content === '!panel') {
        if (!msg.member.permissions.has('Administrator')) return;
        const result = await client.createTicketPanel(msg.channel.id);
        if (result.success) msg.delete().catch(() => { });
        else msg.reply('Failed to send panel: ' + result.error);
    }
});

// Simple Backup Commands
client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith('!backup')) return;

    if (!msg.member || !msg.member.permissions.has('Administrator')) return msg.reply('❌ Admin only');

    const args = msg.content.split(' ');
    const action = args[1];

    if (action === 'create') {
        const status = await msg.reply('⏳ Creating Backup... (Roles, Channels, Messages)');
        const res = await createBackup(msg.guild);
        if (res.success) status.edit(`✅ **Backup Complete!**\n📂 File: \`${res.filename}\`\n📦 Size: ${(res.size / 1024).toFixed(2)} KB`);
        else status.edit(`❌ Failed: ${res.error}`);
    }
    else if (action === 'list') {
        const files = loadBackups();
        const list = files.slice(0, 10).map((f, i) => `${i + 1}. \`${f.name}\` - ${(f.size / 1024).toFixed(1)}KB`).join('\n');
        msg.reply(`**💾 Local Backups**:\n${list || 'No backups found.'}`);
    }
});

module.exports = { client };
