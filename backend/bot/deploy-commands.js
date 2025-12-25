const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// Load all command files
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
            console.log(`✅ Loaded command: ${command.data.name}`);
        }
    }
}

// Register commands with Discord
const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
    try {
        console.log(`🔄 Registering ${commands.length} slash commands...`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ Successfully registered ${data.length} slash commands!`);
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
})();
