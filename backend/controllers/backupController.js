const { createClient } = require('@supabase/supabase-js');
const { performBackup, restoreBackup, cleanOldBackups } = require('../services/backupService');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

/**
 * Create a manual backup
 */
exports.createBackup = async (req, res) => {
    try {
        const { user_id } = req.body; // Optional: track who created it
        const result = await performBackup('manual', user_id);

        if (result.success) {
            res.json({ success: true, data: result.backup });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Get all backups
 */
exports.getAllBackups = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('backups')
            .select('id, backup_name, backup_type, file_size_kb, tables_included, created_at, created_by')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Get specific backup with full data
 */
exports.getBackupById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('backups')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Restore from backup
 */
exports.restoreFromBackup = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await restoreBackup(id);

        if (result.success) {
            res.json({ success: true, restoredTables: result.restoredTables });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Delete a backup
 */
exports.deleteBackup = async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('backups')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Backup deleted' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Clean old backups (30+ days)
 */
exports.cleanOldBackups = async (req, res) => {
    try {
        const result = await cleanOldBackups();
        res.json(result);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
