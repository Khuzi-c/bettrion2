const { SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin dashboard and controls')
        .addSubcommand(subcommand =>
            subcommand
                .setName('dashboard')
                .setDescription('View admin dashboard')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('maintenance')
                .setDescription('Toggle maintenance mode')
                .addStringOption(option =>
                    option.setName('mode')
                        .setDescription('Enable or disable')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Enable', value: 'enable' },
                            { name: 'Disable', value: 'disable' }
                        )
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'dashboard') {
            // Get platform stats
            const { data: tickets } = await supabase.from('tickets').select('status');
            const { data: casinos } = await supabase.from('casinos').select('id');

            const openTickets = tickets?.filter(t => t.status === 'OPEN').length || 0;
            const totalCasinos = casinos?.length || 0;

            await interaction.reply({
                embeds: [{
                    color: 0xf6d56a,
                    title: '🎰 BETTRION ADMIN DASHBOARD',
                    fields: [
                        { name: '📊 Stats', value: '\u200b', inline: false },
                        { name: '🎫 Open Tickets', value: `${openTickets}`, inline: true },
                        { name: '🎰 Total Casinos', value: `${totalCasinos}`, inline: true },
                        { name: '✅ Server Status', value: 'Online', inline: true }
                    ],
                    timestamp: new Date()
                }],
                components: [{
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 2,
                            label: '🔧 Maintenance',
                            custom_id: 'admin_maintenance'
                        },
                        {
                            type: 2,
                            style: 1,
                            label: '📢 Announce',
                            custom_id: 'admin_announce'
                        },
                        {
                            type: 2,
                            style: 1,
                            label: '💾 Backup',
                            custom_id: 'admin_backup'
                        }
                    ]
                }]
            });
        } else if (subcommand === 'maintenance') {
            const mode = interaction.options.getString('mode');
            const enabled = mode === 'enable';

            // Update maintenance mode
            await supabase
                .from('site_settings')
                .upsert({
                    setting_key: 'maintenance_mode',
                    setting_value: enabled ? 'true' : 'false',
                    updated_by: interaction.user.tag
                }, { onConflict: 'setting_key' });

            await interaction.reply({
                embeds: [{
                    color: enabled ? 0xef4444 : 0x10b981,
                    title: enabled ? '🚧 Maintenance Mode Enabled' : '✅ Maintenance Mode Disabled',
                    description: enabled
                        ? 'Website is now in maintenance mode. Only admin pages are accessible.'
                        : 'Website is now live and accessible to all users.',
                    timestamp: new Date()
                }]
            });
        }
    },
};
