const { SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Manage users')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all registered users')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user')
                .addStringOption(option =>
                    option.setName('email')
                        .setDescription('User email to ban')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Ban reason')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unban')
                .setDescription('Unban a user')
                .addStringOption(option =>
                    option.setName('email')
                        .setDescription('User email to unban')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'list') {
            // Get all users
            const { data: users, error } = await supabase
                .from('users')
                .select('email, created_at, is_banned')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
            }

            if (!users || users.length === 0) {
                return interaction.reply({ content: '📋 No users found.', ephemeral: true });
            }

            const userList = users.map((u, i) => {
                const status = u.is_banned ? '🚫 Banned' : '✅ Active';
                const date = new Date(u.created_at).toLocaleDateString();
                return `${i + 1}. **${u.email}** - ${status} - Joined: ${date}`;
            }).join('\n');

            await interaction.reply({
                embeds: [{
                    color: 0xf6d56a,
                    title: '👥 Registered Users',
                    description: userList,
                    footer: { text: `Total: ${users.length} users shown` },
                    timestamp: new Date()
                }],
                ephemeral: true
            });

        } else if (subcommand === 'ban') {
            const email = interaction.options.getString('email');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Ban user
            const { error } = await supabase
                .from('users')
                .update({ is_banned: true, ban_reason: reason })
                .eq('email', email);

            if (error) {
                return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
            }

            await interaction.reply({
                embeds: [{
                    color: 0xef4444,
                    title: '🚫 User Banned',
                    description: `**${email}** has been banned.`,
                    fields: [
                        { name: 'Reason', value: reason }
                    ],
                    timestamp: new Date()
                }]
            });

        } else if (subcommand === 'unban') {
            const email = interaction.options.getString('email');

            // Unban user
            const { error } = await supabase
                .from('users')
                .update({ is_banned: false, ban_reason: null })
                .eq('email', email);

            if (error) {
                return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
            }

            await interaction.reply({
                embeds: [{
                    color: 0x10b981,
                    title: '✅ User Unbanned',
                    description: `**${email}** has been unbanned.`,
                    timestamp: new Date()
                }]
            });
        }
    },
};
