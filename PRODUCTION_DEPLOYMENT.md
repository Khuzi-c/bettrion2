# 🚀 Bettrion V2 - Production Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Environment Variables
Ensure all required variables are set in `.env`:

```env
# Database
SUPABASE_URL=your_production_supabase_url
SUPABASE_KEY=your_production_supabase_key

# Discord Bot
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
DISCORD_GUILD_ID=your_server_id
DISCORD_SUPPORT_CHANNEL_ID=your_support_channel_id
DISCORD_ANNOUNCEMENT_CHANNEL_ID=your_announcement_channel_id
DISCORD_ADMIN_LOG_CHANNEL_ID=your_admin_log_channel_id
DISCORD_STAFF_ROLE_ID=your_staff_role_id

# Server
PORT=30055
BASE_URL=https://bettrion.com
NODE_ENV=production
```

### 2. Database Setup

Run all SQL scripts in Supabase:

```bash
# Core tables
✅ create_ticket_discord_mapping.sql
✅ create_site_settings_table.sql
✅ create_announcements_table.sql

# Verify tables exist:
- tickets
- messages
- users
- casinos
- articles
- ticket_discord_mapping
- site_settings
- announcements
- activity_logs
- backups
```

### 3. Discord Bot Setup

**Register Commands:**
```bash
node backend/bot/deploy-commands.js
```

**Verify Commands:**
- `/admin` - Dashboard & maintenance
- `/casino` - Casino management
- `/ticket` - Ticket management
- `/img` - Image management
- `/user` - User management

**Bot Permissions Required:**
- Read Messages/View Channels
- Send Messages
- Create Private Threads
- Manage Threads
- Embed Links
- Attach Files
- Add Reactions
- Mention @everyone, @here, and All Roles

### 4. File Structure Check

```
test_web1/
├── frontend/
│   ├── index.html ✅
│   ├── support.html ✅
│   ├── casinos.html ✅
│   ├── articles.html ✅
│   ├── admin/ ✅
│   └── assets/
│       ├── css/style.css ✅
│       ├── js/api.js ✅
│       └── js/support-widget.js ✅
├── backend/
│   ├── controllers/ ✅
│   ├── routes/api.js ✅
│   ├── bot/
│   │   ├── bot.js ✅
│   │   ├── commands/ (5 commands) ✅
│   │   ├── events/ (2 events) ✅
│   │   └── utils/notifications.js ✅
│   └── data/uploads/ ✅
└── server.js ✅
```

### 5. Features Verification

**Core Features:**
- [x] Casino listings with ratings
- [x] Article/news system
- [x] Support ticket system
- [x] Admin panel
- [x] User authentication
- [x] Activity tracking
- [x] Backup system

**Discord Integration:**
- [x] Bidirectional ticket sync
- [x] Admin commands
- [x] Casino management
- [x] User management
- [x] Image uploads
- [x] Real-time notifications
- [x] Ticket transcripts
- [x] Rotating bot status

**Admin Features:**
- [x] Dashboard with stats
- [x] Maintenance mode
- [x] User ban system
- [x] Activity logs
- [x] Backup management
- [x] Settings panel

## 🔧 Production Optimizations

### 1. Security

**Update CORS Settings** (server.js):
```javascript
app.use(cors({
    origin: 'https://bettrion.com',
    credentials: true
}));
```

**Add Rate Limiting:**
```bash
npm install express-rate-limit
```

**Enable Helmet:**
```bash
npm install helmet
```

### 2. Performance

**Enable Compression:**
```bash
npm install compression
```

**Add to server.js:**
```javascript
const compression = require('compression');
app.use(compression());
```

**Static File Caching:**
```javascript
app.use(express.static('frontend', {
    maxAge: '1d',
    etag: true
}));
```

### 3. Monitoring

**Add PM2 for Process Management:**
```bash
npm install -g pm2
pm2 start server.js --name bettrion
pm2 save
pm2 startup
```

**PM2 Commands:**
```bash
pm2 status          # Check status
pm2 logs bettrion   # View logs
pm2 restart bettrion # Restart
pm2 stop bettrion   # Stop
```

## 🌐 Deployment Steps

### Option 1: VPS/Dedicated Server

1. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Clone/Upload Project:**
```bash
git clone your-repo-url bettrion
cd bettrion
npm install
```

3. **Setup Environment:**
```bash
cp .env.example .env
nano .env  # Add production values
```

4. **Start with PM2:**
```bash
pm2 start server.js --name bettrion
pm2 save
```

5. **Setup Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name bettrion.com www.bettrion.com;

    location / {
        proxy_pass http://localhost:30055;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. **SSL Certificate:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d bettrion.com -d www.bettrion.com
```

### Option 2: Cloud Platform (Heroku/Railway/Render)

1. **Create `Procfile`:**
```
web: node server.js
```

2. **Add to `package.json`:**
```json
{
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": "18.x"
  }
}
```

3. **Deploy:**
- Connect GitHub repo
- Set environment variables
- Deploy branch

## 📊 Post-Deployment

### 1. Test All Features

**Website:**
- [ ] Homepage loads
- [ ] Casino listings work
- [ ] Articles display
- [ ] Support widget works
- [ ] Admin panel accessible

**Discord Bot:**
- [ ] Bot online (DND status)
- [ ] Status rotating every 10s
- [ ] `/admin dashboard` works
- [ ] `/casino add` works
- [ ] `/ticket view` works
- [ ] `/img upload` works
- [ ] `/user list` works

**Ticket System:**
- [ ] Create ticket from website
- [ ] Discord thread created
- [ ] Messages sync both ways
- [ ] Close ticket works
- [ ] Transcript generation works

### 2. Monitor Logs

```bash
pm2 logs bettrion --lines 100
```

### 3. Setup Backups

**Automated Database Backups:**
- Use Supabase automatic backups
- Or setup cron job for manual backups

**File Backups:**
```bash
# Add to crontab
0 2 * * * tar -czf /backups/bettrion-$(date +\%Y\%m\%d).tar.gz /path/to/bettrion
```

## 🎯 Final Checklist

- [ ] All environment variables set
- [ ] Database tables created
- [ ] Discord bot commands registered
- [ ] Bot status rotating
- [ ] SSL certificate installed
- [ ] Domain pointing to server
- [ ] PM2 running and saved
- [ ] Nginx configured
- [ ] All features tested
- [ ] Monitoring setup
- [ ] Backups configured
- [ ] Error logging enabled

## 🚨 Troubleshooting

**Bot Not Responding:**
- Check `DISCORD_CLIENT_ID` is set
- Run `node backend/bot/deploy-commands.js`
- Restart server

**Tickets Not Creating:**
- Check Supabase connection
- Verify `messages` table exists
- Check console for errors

**Discord Threads Not Creating:**
- Verify bot has thread permissions
- Check `DISCORD_SUPPORT_CHANNEL_ID` is correct
- Ensure bot is in the server

## 📞 Support

For issues, check:
1. Server logs: `pm2 logs bettrion`
2. Discord bot console
3. Browser console (F12)
4. Supabase logs

---

**🎉 Bettrion V2 is ready for production!**

**Live URL:** https://bettrion.com  
**Discord:** discord.gg/bettrion  
**Admin Panel:** https://bettrion.com/admin
