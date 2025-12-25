const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

const DATA_DIR = path.join(__dirname, '../data');
const BACKUP_DIR = path.join(__dirname, '../backups');

const jsonService = {
    loadJson: (filename) => {
        const filePath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filePath)) {
            return []; // Return empty array if file doesn't exist
        }
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            console.error(`Error reading ${filename}:`, err);
            return [];
        }
    },

    saveJson: (filename, data) => {
        const filePath = path.join(DATA_DIR, filename);
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (err) {
            console.error(`Error writing ${filename}:`, err);
            return false;
        }
    },

    generateId: () => {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    },

    autoBackup: () => {
        const date = new Date().toISOString().split('T')[0];
        const dailyBackupDir = path.join(BACKUP_DIR, date);

        if (!fs.existsSync(dailyBackupDir)) {
            fs.mkdirSync(dailyBackupDir, { recursive: true });
        }

        const files = fs.readdirSync(DATA_DIR);
        files.forEach(file => {
            if (file.endsWith('.json')) {
                const src = path.join(DATA_DIR, file);
                const dest = path.join(dailyBackupDir, file);
                fs.copyFileSync(src, dest);
            }
        });
        console.log(`Backup completed for ${date}`);
    }
};

// Schedule daily backup at midnight
cron.schedule('0 0 * * *', () => {
    jsonService.autoBackup();
});

module.exports = jsonService;
