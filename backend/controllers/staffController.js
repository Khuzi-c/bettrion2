const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.clockIn = async (req, res) => {
    try {
        const { user_id } = req.body;
        // Check if already clocked in
        const { data: existing } = await supabase
            .from('staff_logs')
            .select('*')
            .eq('user_id', user_id)
            .is('clock_out', null)
            .single();

        if (existing) {
            return res.status(400).json({ success: false, error: 'Already clocked in' });
        }

        const { data, error } = await supabase
            .from('staff_logs')
            .insert([{ user_id }])
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.clockOut = async (req, res) => {
    try {
        const { user_id } = req.body;

        // Find open session
        const { data: session } = await supabase
            .from('staff_logs')
            .select('*')
            .eq('user_id', user_id)
            .is('clock_out', null)
            .single();

        if (!session) {
            return res.status(400).json({ success: false, error: 'No active session found' });
        }

        const now = new Date();
        const start = new Date(session.clock_in);
        const duration = (now - start) / 1000 / 60; // minutes

        const { data, error } = await supabase
            .from('staff_logs')
            .update({ clock_out: now.toISOString(), duration_minutes: duration })
            .eq('id', session.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getStaffStatus = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { data } = await supabase
            .from('staff_logs')
            .select('*')
            .eq('user_id', user_id)
            .is('clock_out', null)
            .single();

        res.json({ success: true, is_clocked_in: !!data, session: data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getAllLogs = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('staff_logs')
            .select('*, users(email)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
