const fs = require('fs');
const path = require('path');

const generateTranscript = async (channel, messages) => {
    // Basic HTML Template
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Transcript - ${channel.name}</title>
        <style>
            body { background: #36393f; color: #dcddde; font-family: sans-serif; font-size: 16px; padding: 20px; }
            .msg { display: flex; margin-bottom: 20px; }
            .avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; }
            .content { flex: 1; }
            .header { margin-bottom: 5px; }
            .username { font-weight: bold; color: #fff; }
            .timestamp { font-size: 12px; color: #72767d; margin-left: 10px; }
            .text { white-space: pre-wrap; }
            .embed { border-left: 4px solid #202225; background: #2f3136; padding: 10px; margin-top: 5px; border-radius: 4px; }
        </style>
    </head>
    <body>
        <h1>Transcript: #${channel.name}</h1>
        <p>Exported at: ${new Date().toLocaleString()}</p>
        <hr>
    `;

    // Reverse messages to show chronological order (Discord fetches newest first)
    const sorted = Array.from(messages.values()).reverse();

    for (const msg of sorted) {
        const avatar = msg.author.displayAvatarURL({ format: 'png', dynamic: true });
        const time = msg.createdAt.toLocaleString();

        html += `
        <div class="msg">
            <img src="${avatar}" class="avatar">
            <div class="content">
                <div class="header">
                    <span class="username">${msg.author.username}</span>
                    <span class="timestamp">${time}</span>
                </div>
                <div class="text">${msg.content}</div>
                ${msg.embeds.map(e => `
                    <div class="embed" style="border-color: #${e.color ? e.color.toString(16) : '202225'}">
                        ${e.title ? `<b>${e.title}</b><br>` : ''}
                        ${e.description || ''}
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    html += `</body></html>`;

    // Save File
    const transcriptDir = path.join(__dirname, '../../data/transcripts');
    if (!fs.existsSync(transcriptDir)) fs.mkdirSync(transcriptDir, { recursive: true });

    const filename = `ticket-${channel.name}-${Date.now()}.html`;
    const filePath = path.join(transcriptDir, filename);

    fs.writeFileSync(filePath, html);

    return filename; // Return relative filename
};

module.exports = { generateTranscript };
