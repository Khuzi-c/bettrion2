require('dotenv').config();
const app = require('./app');
const http = require('http');
const path = require('path'); // Added path module
const { Server } = require("socket.io"); // Socket.io

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Make IO globally accessible
global.io = io;

io.on('connection', (socket) => {
    console.log(`🔌 Socket Connected: ${socket.id}`);

    // Join Admin Room (triggered by frontend)
    socket.on('join_admin', () => {
        socket.join('admin');
        console.log(`🔌 ${socket.id} joined Admin Channels`);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to view the app`);
});

// --- Simple File Logger ---
const fs = require('fs');
const logPath = path.join(__dirname, 'logs');
if (!fs.existsSync(logPath)) fs.mkdirSync(logPath);
const logFile = path.join(logPath, 'server.log');

// Override console.log to write to file too
const originalLog = console.log;
const originalErr = console.error;

console.log = function (...args) {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    const line = `[${new Date().toISOString()}] INFO: ${msg}\n`;
    fs.appendFile(logFile, line, () => { });

    // Live Terminal Stream
    if (global.io) global.io.to('admin').emit('bot_log', { type: 'info', msg: msg, ts: new Date().toISOString() });

    originalLog.apply(console, args);
};

console.error = function (...args) {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
    const line = `[${new Date().toISOString()}] ERROR: ${msg}\n`;
    fs.appendFile(logFile, line, () => { });

    // Live Terminal Stream
    if (global.io) global.io.to('admin').emit('bot_log', { type: 'error', msg: msg, ts: new Date().toISOString() });

    originalErr.apply(console, args);
};

// --- Server Pulse (Heartbeat) ---
setInterval(() => {
    if (global.io) {
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        global.io.to('admin').emit('server_pulse', {
            ram: `${Math.round(used)} MB`,
            uptime: Math.floor(process.uptime()),
            timestamp: Date.now()
        });
    }
}, 3000);


