const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('img')
        .setDescription('Manage images')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all uploaded images')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('upload')
                .setDescription('Upload an image')
                .addAttachmentOption(option =>
                    option.setName('image')
                        .setDescription('Image file to upload')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'list') {
            // Get list of uploaded images
            const uploadsDir = path.join(__dirname, '../../../backend/data/uploads');

            if (!fs.existsSync(uploadsDir)) {
                return interaction.reply({ content: '📁 No images uploaded yet.', ephemeral: true });
            }

            const files = fs.readdirSync(uploadsDir).filter(f =>
                /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
            );

            if (files.length === 0) {
                return interaction.reply({ content: '📁 No images found.', ephemeral: true });
            }

            // Create list with copy-able links
            const baseUrl = process.env.BASE_URL || 'http://localhost:30055';
            const imageList = files.slice(0, 10).map((file, i) => {
                const url = `${baseUrl}/uploads/${file}`;
                return `${i + 1}. **${file}**\n   🔗 \`${url}\``;
            }).join('\n\n');

            await interaction.reply({
                embeds: [{
                    color: 0xf6d56a,
                    title: '📁 Uploaded Images',
                    description: imageList,
                    footer: { text: `Total: ${files.length} images` },
                    timestamp: new Date()
                }],
                ephemeral: true
            });

        } else if (subcommand === 'upload') {
            const attachment = interaction.options.getAttachment('image');

            if (!attachment.contentType?.startsWith('image/')) {
                return interaction.reply({ content: '❌ Please upload a valid image file.', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            try {
                // Create uploads directory if it doesn't exist
                const uploadsDir = path.join(__dirname, '../../../backend/data/uploads');
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }

                // Generate unique filename
                const ext = path.extname(attachment.name);
                const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
                const filepath = path.join(uploadsDir, filename);

                // Download image
                await downloadImage(attachment.url, filepath);

                const baseUrl = process.env.BASE_URL || 'http://localhost:30055';
                const imageUrl = `${baseUrl}/uploads/${filename}`;

                await interaction.editReply({
                    embeds: [{
                        color: 0x10b981,
                        title: '✅ Image Uploaded',
                        description: `**Filename:** ${filename}\n**URL:** \`${imageUrl}\``,
                        image: { url: imageUrl },
                        footer: { text: 'Copy the URL above to use this image' },
                        timestamp: new Date()
                    }]
                });

            } catch (err) {
                console.error('Upload error:', err);
                await interaction.editReply({ content: `❌ Upload failed: ${err.message}` });
            }
        }
    },
};

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}
