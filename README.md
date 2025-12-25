# Bettrion V2 - Casino Review Platform

A comprehensive casino review platform with Discord bot integration for support tickets, admin management, and real-time notifications.

## 🎯 Features

### Website
- **Casino Reviews** - Detailed casino listings with ratings
- **Articles & News** - Latest casino news and guides
- **Support System** - Live chat widget with ticket management
- **Admin Panel** - Full-featured admin dashboard
- **Analytics** - Track user activity and engagement

### Discord Bot Integration
- **Bidirectional Tickets** - Sync support tickets between web and Discord
- **Admin Commands** - Manage platform from Discord
- **Casino Management** - Add/edit/remove casinos via commands
- **User Management** - Ban/unban users from Discord
- **Image Uploads** - Upload and manage images
- **Real-time Notifications** - Instant alerts for platform events

## 🤖 Discord Commands

- `/admin dashboard` - View platform statistics
- `/admin maintenance enable/disable` - Toggle maintenance mode
- `/casino add/list/remove` - Manage casinos
- `/ticket view/close/transcript` - Manage support tickets
- `/img list/upload` - Manage images
- `/user list/ban/unban` - Manage users

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Discord bot application

### Installation

1. **Clone repository:**
```bash
git clone <repo-url>
cd test_web1
npm install
```

2. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Run database migrations:**
- Execute SQL files in Supabase:
  - `create_ticket_discord_mapping.sql`
  - `create_site_settings_table.sql`
  - `create_announcements_table.sql`

4. **Register Discord commands:**
```bash
npm run deploy-commands
```

5. **Start server:**
```bash
npm start
```

## 📁 Project Structure

```
test_web1/
├── frontend/           # Website files
│   ├── index.html
│   ├── support.html
│   ├── casinos.html
│   ├── admin/         # Admin panel
│   └── assets/        # CSS, JS, images
├── backend/
│   ├── controllers/   # Business logic
│   ├── routes/        # API routes
│   ├── bot/          # Discord bot
│   │   ├── commands/ # Slash commands
│   │   ├── events/   # Event handlers
│   │   └── utils/    # Bot utilities
│   └── data/         # Uploads, backups
├── server.js         # Main server file
└── .env             # Environment variables
```

## 🔧 Configuration

### Required Environment Variables

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Discord
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_server_id
DISCORD_SUPPORT_CHANNEL_ID=channel_id
DISCORD_STAFF_ROLE_ID=role_id

# Server
PORT=30055
BASE_URL=http://localhost:30055
```

## 📚 Documentation

- [Production Deployment Guide](PRODUCTION_DEPLOYMENT.md)
- [API Documentation](docs/API.md)
- [Discord Bot Setup](docs/DISCORD_SETUP.md)

## 🎨 Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** Supabase (PostgreSQL)
- **Bot:** Discord.js v14
- **Real-time:** WebSocket (planned)

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Admin authentication required
- Rate limiting on API endpoints
- Input validation and sanitization

## 📊 Features Status

- [x] Casino listings
- [x] Article system
- [x] Support tickets
- [x] Discord integration
- [x] Admin panel
- [x] User management
- [x] Activity tracking
- [x] Backup system
- [x] Maintenance mode
- [x] Image uploads
- [x] Ticket transcripts
- [x] Real-time notifications

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📞 Support

- Website: https://bettrion.com
- Discord: discord.gg/bettrion
- Email: support@bettrion.com

---

**Built with ❤️ by the Bettrion Team**
