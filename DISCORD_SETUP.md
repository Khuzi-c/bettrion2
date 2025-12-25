# Discord Bot Setup - REQUIRED

## Environment Variables

Add these to your `.env` file:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_application_id_here
DISCORD_GUILD_ID=your_server_id_here

# Discord Channel IDs
DISCORD_SUPPORT_CHANNEL_ID=your_support_channel_id
DISCORD_STAFF_ROLE_ID=your_staff_role_id
```

## How to Get These Values

### 1. DISCORD_BOT_TOKEN
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to "Bot" tab
4. Click "Reset Token" and copy it

### 2. DISCORD_CLIENT_ID
1. In Discord Developer Portal
2. Select your application
3. Go to "General Information"
4. Copy "APPLICATION ID"

### 3. DISCORD_GUILD_ID
1. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
2. Right-click your server
3. Click "Copy Server ID"

### 4. DISCORD_SUPPORT_CHANNEL_ID
1. Right-click the channel where tickets should appear
2. Click "Copy Channel ID"

### 5. DISCORD_STAFF_ROLE_ID
1. Server Settings → Roles
2. Right-click the staff role
3. Click "Copy Role ID"

## Register Slash Commands

Run this ONCE after adding DISCORD_CLIENT_ID:

```bash
node backend/bot/deploy-commands.js
```

You should see:
```
✅ Loaded command: admin
🔄 Registering 1 slash commands...
✅ Successfully registered 1 slash commands!
```

## Restart Server

```bash
node server.js
```

You should see:
```
✅ Loaded command: admin
✅ Loaded event: messageCreate
✅ Loaded event: interactionCreate
Bot is Ready: Bettrion Support#5968
```

## Test Commands

In Discord, type:
- `/admin dashboard` - View admin panel
- `/admin maintenance enable` - Enable maintenance mode
- `/admin maintenance disable` - Disable maintenance mode

## Troubleshooting

**"Application did not respond"**
- Make sure `DISCORD_CLIENT_ID` is set
- Run `deploy-commands.js` to register commands
- Restart the server

**Commands don't appear**
- Wait 1-2 minutes for Discord to update
- Try in a different channel
- Kick and re-invite the bot

**Bot offline**
- Check `DISCORD_BOT_TOKEN` is correct
- Make sure bot has proper intents enabled in Developer Portal
