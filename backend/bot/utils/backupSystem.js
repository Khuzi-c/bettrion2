const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../../data/backups');

// Ensure Dir Exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const createBackup = async (guild) => {
    const backupData = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        guild: {
            name: guild.name,
            id: guild.id,
            icon: guild.iconURL()
        },
        roles: [],
        channels: []
    };

    console.log(`[Backup] Starting backup for ${guild.name}...`);

    // 1. ROLES
    const roles = await guild.roles.fetch();
    backupData.roles = roles.map(r => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        hoist: r.hoist,
        permissions: r.permissions.bitfield.toString(),
        position: r.position
    })).sort((a, b) => b.position - a.position);

    // 2. CHANNELS & MESSAGES
    const channels = await guild.channels.fetch();
    const sortedChannels = Array.from(channels.values()).sort((a, b) => a.position - b.position);

    for (const channel of sortedChannels) {
        if (!channel) continue;

        const chanData = {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            parentId: channel.parentId,
            position: channel.position,
            permissions: [], // TODO: Serialize overwrites
            messages: []
        };

        // Fetch Messages (Text Channels only)
        if (channel.isTextBased()) {
            try {
                // Fetch last 50 messages to avoid hitting strict rate limits during full backup
                const messages = await channel.messages.fetch({ limit: 50 });
                chanData.messages = Array.from(messages.values()).reverse().map(m => ({
                    id: m.id,
                    content: m.content,
                    author: {
                        username: m.author.username,
                        avatar: m.author.displayAvatarURL(),
                        bot: m.author.bot
                    },
                    embeds: m.embeds,
                    attachments: m.attachments.map(a => a.url),
                    createdAt: m.createdAt
                }));
            } catch (e) {
                console.warn(`[Backup] Could not fetch messages for ${channel.name}: ${e.message}`);
            }
        }

        backupData.channels.push(chanData);
    }

    // Save File
    const filename = `${backupData.id}-${guild.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    const filePath = path.join(BACKUP_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    console.log(`[Backup] Saved to ${filename}`);
    return { success: true, filename, size: fs.statSync(filePath).size };
};

const loadBackups = () => {
    try {
        const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
        return files.map(f => {
            const stat = fs.statSync(path.join(BACKUP_DIR, f));
            return { name: f, created: stat.birthtime, size: stat.size };
        }).sort((a, b) => b.created - a.created);
    } catch (e) { return []; }
};

const restoreBackup = async (guild, backupId) => {
    const filePath = path.join(BACKUP_DIR, backupId);
    if (!fs.existsSync(filePath)) return { success: false, error: 'Backup not found' };

    const backup = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`[Restore] Restoring ${backup.id}...`);

    try {
        // 1. Create Restore Category
        const category = await guild.channels.create({
            name: `📦 RESTORED - ${new Date().toLocaleTimeString()}`,
            type: 4 // GuildCategory
        });

        // 2. Restore Channels & Messages
        for (const chanData of backup.channels) {
            if (chanData.type !== 0) continue; // Text only for now

            // Create Channel
            const channel = await guild.channels.create({
                name: chanData.name,
                type: 0,
                parent: category.id
            });

            // Create Webhook for replay
            const webhook = await channel.createWebhook({
                name: 'Backup Replay',
                avatar: 'https://cdn.discordapp.com/embed/avatars/0.png'
            });

            // Replay Messages (stored new->old in fetch, reversed in createBackup to store old->new? 
            // In createBackup I did: Array.from(messages.values()).reverse(). So it is OLD -> NEW.
            // If I iterate normally, it plays OLD -> NEW. Correct.
            for (const msg of chanData.messages) {
                const username = msg.author.username || 'Unknown';
                const avatarURL = msg.author.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png';

                // Skip partial empty messages
                if (!msg.content && (!msg.embeds || msg.embeds.length === 0) && (!msg.attachments || msg.attachments.length === 0)) continue;

                await webhook.send({
                    content: msg.content || null,
                    username: username,
                    avatarURL: avatarURL,
                    embeds: msg.embeds,
                    files: msg.attachments
                }).catch(e => console.log(`Failed to replay msg: ${e.message}`));

                // Rate limit safe buffer
                await new Promise(r => setTimeout(r, 800));
            }

            await webhook.delete();
        }

        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: e.message };
    }
};

module.exports = { createBackup, loadBackups, restoreBackup, BACKUP_DIR };
