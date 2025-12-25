const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('casino')
        .setDescription('Manage casinos')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a new casino')
                .addStringOption(option => option.setName('name').setDescription('Casino name').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('Description').setRequired(true))
                .addNumberOption(option => option.setName('rating').setDescription('Rating (0-5)').setRequired(true))
                .addStringOption(option => option.setName('logo').setDescription('Logo URL').setRequired(false))
                .addStringOption(option => option.setName('affiliate_link').setDescription('Affiliate link').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all casinos')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a casino')
                .addStringOption(option => option.setName('name').setDescription('Casino name').setRequired(true))
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const name = interaction.options.getString('name');
            const description = interaction.options.getString('description');
            const rating = interaction.options.getNumber('rating');
            const logo = interaction.options.getString('logo') || 'https://via.placeholder.com/200';
            const affiliateLink = interaction.options.getString('affiliate_link') || '#';

            // Generate slug
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            // Insert casino
            const { data, error } = await supabase
                .from('casinos')
                .insert([{
                    name,
                    description,
                    rating,
                    images: [logo],
                    affiliate_link: affiliateLink,
                    slug,
                    category: 'Casino'
                }])
                .select()
                .single();

            if (error) {
                return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
            }

            // Send notification to announcements channel
            const announcementChannelId = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID;
            if (announcementChannelId) {
                const channel = await interaction.client.channels.fetch(announcementChannelId);
                if (channel) {
                    await channel.send({
                        embeds: [{
                            color: 0xf6d56a,
                            title: '🎰 New Casino Added!',
                            description: `**${name}** has been added to Bettrion!`,
                            fields: [
                                { name: '⭐ Rating', value: `${rating}/5.0`, inline: true },
                                { name: '🔗 Link', value: `[View Casino](https://bettrion.com/casinos/${slug})`, inline: true }
                            ],
                            thumbnail: { url: logo },
                            timestamp: new Date()
                        }]
                    });
                }
            }

            await interaction.reply({
                embeds: [{
                    color: 0x10b981,
                    title: '✅ Casino Added Successfully',
                    description: `**${name}** has been added to the platform!`,
                    fields: [
                        { name: 'Rating', value: `${rating}/5.0`, inline: true },
                        { name: 'Slug', value: slug, inline: true }
                    ],
                    timestamp: new Date()
                }]
            });

        } else if (subcommand === 'list') {
            const { data: casinos, error } = await supabase
                .from('casinos')
                .select('name, rating')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
            }

            const casinoList = casinos.map((c, i) =>
                `${i + 1}. **${c.name}** - ⭐ ${c.rating}/5.0`
            ).join('\n') || 'No casinos found';

            await interaction.reply({
                embeds: [{
                    color: 0xf6d56a,
                    title: '🎰 Casino List',
                    description: casinoList,
                    footer: { text: `Total: ${casinos.length} casinos` },
                    timestamp: new Date()
                }]
            });

        } else if (subcommand === 'remove') {
            const name = interaction.options.getString('name');

            const { error } = await supabase
                .from('casinos')
                .delete()
                .eq('name', name);

            if (error) {
                return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
            }

            await interaction.reply({
                embeds: [{
                    color: 0xef4444,
                    title: '🗑️ Casino Removed',
                    description: `**${name}** has been removed from the platform.`,
                    timestamp: new Date()
                }]
            });
        }
    },
};
