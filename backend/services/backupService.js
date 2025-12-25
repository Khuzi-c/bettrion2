const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Tables to backup
const TABLES_TO_BACKUP = ['casinos', 'articles', 'tickets', 'messages', 'users', 'settings', 'staff_logs'];

/**
 * Perform a full database backup
 * @param {string} type - 'auto' or 'manual'
 * @param {string} userId - User ID who initiated (null for auto)
 * @returns {Promise<object>} Backup result
 */
async function performBackup(type = 'auto', userId = null) {
    try {
        const backupData = {
            backup_metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0',
                tables: TABLES_TO_BACKUP
            },
            data: {}
        };

        // Fetch data from all tables
        for (const table of TABLES_TO_BACKUP) {
            const { data, error } = await supabase.from(table).select('*');
            if (error) {
                console.error(`Error backing up table ${table}:`, error);
                backupData.data[table] = [];
            } else {
                backupData.data[table] = data || [];
            }
        }

        // Calculate size
        const backupJson = JSON.stringify(backupData);
        const sizeKb = Math.round(Buffer.byteLength(backupJson, 'utf8') / 1024);

        // Generate backup name
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupName = `${type}-backup-${timestamp}`;

        // Save backup to database
        const { data: savedBackup, error: saveError } = await supabase
            .from('backups')
            .insert([{
                backup_name: backupName,
                backup_type: type,
                backup_data: backupData,
                file_size_kb: sizeKb,
                tables_included: TABLES_TO_BACKUP,
                created_by: userId
            }])
            .select()
            .single();

        if (saveError) throw saveError;

        console.log(`✅ Backup created: ${backupName} (${sizeKb}KB)`);
        return { success: true, backup: savedBackup };

    } catch (err) {
        console.error('❌ Backup failed:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Restore database from backup
 * @param {string} backupId - Backup ID to restore
 * @returns {Promise<object>} Restore result
 */
async function restoreBackup(backupId) {
    try {
        // Get backup data
        const { data: backup, error: fetchError } = await supabase
            .from('backups')
            .select('*')
            .eq('id', backupId)
            .single();

        if (fetchError) throw fetchError;
        if (!backup) throw new Error('Backup not found');

        const backupData = backup.backup_data;
        const restoredTables = [];

        // Restore each table
        for (const table of TABLES_TO_BACKUP) {
            if (backupData.data[table] && backupData.data[table].length > 0) {
                // Delete existing data
                const { error: deleteError } = await supabase
                    .from(table)
                    .delete()
                    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

                if (deleteError) {
                    console.error(`Error clearing table ${table}:`, deleteError);
                    continue;
                }

                // Insert backup data
                const { error: insertError } = await supabase
                    .from(table)
                    .insert(backupData.data[table]);

                if (insertError) {
                    console.error(`Error restoring table ${table}:`, insertError);
                } else {
                    restoredTables.push(table);
                    console.log(`✅ Restored table: ${table}`);
                }
            }
        }

        console.log(`✅ Restore complete. Tables restored: ${restoredTables.join(', ')}`);
        return { success: true, restoredTables };

    } catch (err) {
        console.error('❌ Restore failed:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Clean up old backups (older than 30 days)
 */
async function cleanOldBackups() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await supabase
            .from('backups')
            .delete()
            .lt('created_at', thirtyDaysAgo.toISOString())
            .select();

        if (error) throw error;

        console.log(`🧹 Cleaned ${data?.length || 0} old backups`);
        return { success: true, deleted: data?.length || 0 };

    } catch (err) {
        console.error('❌ Cleanup failed:', err);
        return { success: false, error: err.message };
    }
}

module.exports = {
    performBackup,
    restoreBackup,
    cleanOldBackups
};
