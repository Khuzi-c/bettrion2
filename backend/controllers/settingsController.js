const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

const settingsController = {
    getSetting: async (req, res) => {
        const { key } = req.params;
        const { data } = await supabase.from('site_settings').select('setting_value').eq('setting_key', key).single();
        if (data) {
            try {
                // Try JSON parsing
                if (data.setting_value.startsWith('[') || data.setting_value.startsWith('{')) {
                    res.json(JSON.parse(data.setting_value));
                } else {
                    res.json(data.setting_value);
                }
            } catch (e) {
                res.json(data.setting_value);
            }
        } else {
            res.status(404).json({ message: 'Setting not found' });
        }
    },

    getAllSettings: async (req, res) => {
        const { data } = await supabase.from('site_settings').select('*');
        const settings = {};
        if (data) {
            data.forEach(row => {
                try {
                    if (row.setting_value.startsWith('[') || row.setting_value.startsWith('{')) {
                        settings[row.setting_key] = JSON.parse(row.setting_value);
                    } else {
                        settings[row.setting_key] = row.setting_value;
                    }
                } catch (e) {
                    settings[row.setting_key] = row.setting_value;
                }
            });
        }
        res.json(settings);
    },

    updateSetting: async (req, res) => {
        const { key } = req.params;
        const { value } = req.body; // Expecting { value: ... }

        const valStr = typeof value === 'object' ? JSON.stringify(value) : value;

        const { error } = await supabase.from('site_settings').upsert({
            setting_key: key,
            setting_value: valStr
        });

        if (error) return res.status(500).json({ message: error.message });
        res.json({ message: 'Setting updated' });
    },

    toggleMaintenanceMode: async (req, res) => {
        const { enabled } = req.body;
        const { error } = await supabase.from('site_settings').upsert({
            setting_key: 'maintenance_mode',
            setting_value: enabled ? 'true' : 'false'
        });
        if (error) return res.status(500).json({ message: error.message });
        res.json({ message: 'Maintenance mode updated' });
    }
};

module.exports = settingsController;
