const fs = require('fs');
const path = require('path');

// Circular buffer for in-memory logs
const MAX_LOGS = 500;
const logs = [];

function addLog(type, args) {
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    const entry = {
        timestamp: new Date().toISOString(),
        type: type.toUpperCase(),
        message: msg
    };

    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();

    // Also write to file (optional, but good for persistence)
    // fs.appendFileSync(path.join(__dirname, '../../server.log'), `[${entry.timestamp}] [${entry.type}] ${entry.message}\n`);
}

// Override console methods
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

const Logger = {
    init: () => {
        console.log = (...args) => {
            addLog('info', args);
            originalLog.apply(console, args);
        };
        console.error = (...args) => {
            addLog('error', args);
            originalError.apply(console, args);
        };
        console.warn = (...args) => {
            addLog('warn', args);
            originalWarn.apply(console, args);
        };
        console.log('✅ Admin Logger Initialized');
    },
    getLogs: () => {
        return logs.reverse(); // Newest first
    }
};

module.exports = Logger;
