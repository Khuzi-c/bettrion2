const { SlashCommandBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Manage support tickets')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View ticket details')
                .addStringOption(option => option.setName('id').setDescription('Ticket ID').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close a ticket')
                .addStringOption(option => option.setName('id').setDescription('Ticket ID').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('transcript')
                .setDescription('Generate ticket transcript')
                .addStringOption(option => option.setName('id').setDescription('Ticket ID').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup ticket panel in current channel')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const ticketId = interaction.options.getString('id');

        if (subcommand === 'view') {
            // Get ticket details
            const { data: ticket, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', ticketId)
                .single();

            if (error || !ticket) {
                return interaction.reply({ content: '❌ Ticket not found', ephemeral: true });
            }

            // Get messages
            const { data: messages } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            const messageCount = messages?.length || 0;

            await interaction.reply({
                embeds: [{
                    color: 0xf6d56a,
                    title: `🎫 Ticket #${ticket.short_id || ticketId.substring(0, 8)}`,
                    description: ticket.description || 'No description',
                    fields: [
                        { name: '📧 Email', value: ticket.guest_email || 'N/A', inline: true },
                        { name: '📊 Status', value: ticket.status, inline: true },
                        { name: '⚡ Priority', value: ticket.priority || 'MEDIUM', inline: true },
                        { name: '💬 Messages', value: `${messageCount}`, inline: true },
                        { name: '📅 Created', value: new Date(ticket.created_at).toLocaleDateString(), inline: true }
                    ],
                    timestamp: new Date()
                }]
            });

        } else if (subcommand === 'close') {
            const { error } = await supabase
                .from('tickets')
                .update({ status: 'CLOSED' })
                .eq('id', ticketId);

            if (error) {
                return interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
            }

            await interaction.reply({
                embeds: [{
                    color: 0xef4444,
                    title: '🔒 Ticket Closed',
                    description: `Ticket has been marked as closed.`,
                    timestamp: new Date()
                }]
            });

        } else if (subcommand === 'transcript') {
            await interaction.deferReply();

            // Generate transcript
            const transcript = await generateTranscript(ticketId);

            if (!transcript) {
                return interaction.editReply({ content: '❌ Failed to generate transcript' });
            }

            await interaction.editReply({
                content: '✅ Transcript generated!',
                embeds: [{
                    color: 0x10b981,
                    title: '📄 Ticket Transcript',
                    description: `Transcript saved to: \`/tickets/transcripts/${ticketId}.html\``,
                    fields: [
                        { name: '🔗 View Online', value: `[Click Here](https://bettrion.com/tickets/transcripts/${ticketId})` }
                    ],
                    timestamp: new Date()
                }]
            });
        } else if (subcommand === 'setup') {
            if (!interaction.member.permissions.has('Administrator')) {
                return interaction.reply({ content: '❌ Administrator permissions required.', ephemeral: true });
            }

            await interaction.reply({
                embeds: [{
                    color: 0xf6d56a,
                    title: '🎫 Support Tickets',
                    description: 'Click the button below to contact our support team.',
                    footer: { text: 'Bettrion Support' }
                }],
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        style: 2, // SECONDARY
                        label: 'Open Ticket',
                        emoji: '📩',
                        custom_id: 'create_ticket'
                    }]
                }]
            });
        }
    },
};

async function generateTranscript(ticketId) {
    try {
        // Get ticket and messages
        const { data: ticket } = await supabase.from('tickets').select('*').eq('id', ticketId).single();
        const { data: messages } = await supabase
            .from('ticket_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (!ticket) return null;

        // Generate HTML
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Transcript #${ticket.short_id || ticketId.substring(0, 8)}</title>
    <style>
        body { font-family: 'Inter', sans-serif; background: #0a0f1e; color: #e5e7eb; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: #1a1f2e; border-radius: 12px; padding: 30px; }
        h1 { color: #f6d56a; margin-bottom: 10px; }
        .meta { color: #9ca3af; margin-bottom: 30px; }
        .message { background: #0f1419; border-left: 3px solid #f6d56a; padding: 15px; margin-bottom: 15px; border-radius: 6px; }
        .message.user { border-left-color: #3b82f6; }
        .message.admin { border-left-color: #10b981; }
        .message-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .sender { font-weight: bold; color: #f6d56a; }
        .timestamp { color: #6b7280; font-size: 0.85rem; }
        .content { line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎫 Ticket Transcript #${ticket.short_id || ticketId.substring(0, 8)}</h1>
        <div class="meta">
            <p><strong>Subject:</strong> ${ticket.subject || 'No subject'}</p>
            <p><strong>Email:</strong> ${ticket.guest_email || 'N/A'}</p>
            <p><strong>Status:</strong> ${ticket.status}</p>
            <p><strong>Priority:</strong> ${ticket.priority || 'MEDIUM'}</p>
            <p><strong>Created:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
        </div>
        <hr style="border-color: #374151; margin: 20px 0;">
        <h2 style="color: #f6d56a;">Messages</h2>
        ${messages?.map(msg => `
            <div class="message ${msg.sender_role.toLowerCase()}">
                <div class="message-header">
                    <span class="sender">${msg.sender_role === 'USER' ? '👤 User' : '👨‍💼 Staff'}</span>
                    <span class="timestamp">${new Date(msg.created_at).toLocaleString()}</span>
                </div>
                <div class="content">${msg.content}</div>
            </div>
        `).join('') || '<p>No messages</p>'}
    </div>
</body>
</html>`;

        // Save to file
        const transcriptsDir = path.join(__dirname, '../../../frontend/tickets/transcripts');
        if (!fs.existsSync(transcriptsDir)) {
            fs.mkdirSync(transcriptsDir, { recursive: true });
        }

        const filePath = path.join(transcriptsDir, `${ticketId}.html`);
        fs.writeFileSync(filePath, html);

        return filePath;
    } catch (err) {
        console.error('Error generating transcript:', err);
        return null;
    }
}
