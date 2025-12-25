const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

const affiliateController = {
    // --- USER METHODS ---

    // Get My Stats (Dashboard)
    getMyStats: async (req, res) => {
        try {
            const userId = req.user.id;

            // Get User Profile (Code, Balance)
            const { data: profile } = await supabase
                .from('users')
                .select('referral_code, points_balance, wallet_details')
                .eq('id', userId)
                .single();

            // Ensure referral code exists
            if (!profile.referral_code) {
                const newCode = uuidv4().substring(0, 8); // Simple random code
                await supabase.from('users').update({ referral_code: newCode }).eq('id', userId);
                profile.referral_code = newCode;
            }

            // Get Counts
            const { count: totalInvites } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('referrer_id', userId);

            const { count: pendingInvites } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('referrer_id', userId)
                .eq('status', 'pending');

            const { count: verifiedInvites } = await supabase
                .from('referrals')
                .select('*', { count: 'exact', head: true })
                .eq('referrer_id', userId)
                .eq('status', 'verified');

            res.json({
                success: true,
                profile: {
                    referral_code: profile.referral_code,
                    balance: profile.points_balance,
                    wallet: profile.wallet_details
                },
                stats: {
                    total: totalInvites || 0,
                    pending: pendingInvites || 0,
                    verified: verifiedInvites || 0
                }
            });

        } catch (error) {
            console.error('Affiliate Stats Error:', error);
            res.status(500).json({ message: 'Failed to fetch stats' });
        }
    },

    // Update Referral Code
    updateReferralCode: async (req, res) => {
        try {
            const userId = req.user.id;
            const { newCode } = req.body;

            if (!newCode || newCode.length < 4 || newCode.length > 20) {
                return res.status(400).json({ message: 'Code must be 4-20 characters' });
            }

            if (!/^[a-zA-Z0-9-_]+$/.test(newCode)) {
                return res.status(400).json({ message: 'Only alphanumeric characters allowed' });
            }

            // Check Uniqueness
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('referral_code', newCode)
                .neq('id', userId) // Ignore self
                .single();

            if (existing) {
                return res.status(400).json({ message: 'Code already taken' });
            }

            // Update
            const { error } = await supabase
                .from('users')
                .update({ referral_code: newCode })
                .eq('id', userId);

            if (error) throw error;

            res.json({ success: true, message: 'Referral Code Updated', code: newCode });

        } catch (error) {
            console.error('Update Ref Code Error:', error);
            res.status(500).json({ message: 'Failed to update code' });
        }
    },

    // Request Payout
    requestPayout: async (req, res) => {
        try {
            const userId = req.user.id;
            const { amount, asset, network, address } = req.body;

            if (!amount || !asset || !network || !address) {
                return res.status(400).json({ message: 'Missing fields' });
            }

            const payoutAmount = parseFloat(amount);
            if (payoutAmount < 1.00) {
                return res.status(400).json({ message: 'Minimum payout is $1.00' });
            }

            // Check Balance
            const { data: user } = await supabase.from('users').select('points_balance, name, email, discord_id').eq('id', userId).single();

            if (!user || user.points_balance < payoutAmount) {
                return res.status(400).json({ message: 'Insufficient balance' });
            }

            // Deduct Balance Immediately (Optimistic)
            const newBalance = user.points_balance - payoutAmount;
            const { error: updateError } = await supabase
                .from('users')
                .update({ points_balance: newBalance })
                .eq('id', userId);

            if (updateError) throw updateError;

            // Create Request
            const { data: payout, error: insertError } = await supabase
                .from('payout_requests')
                .insert([{
                    user_id: userId,
                    amount: payoutAmount,
                    asset,
                    network,
                    address,
                    status: 'requested'
                }])
                .select()
                .single();

            if (insertError) {
                // Rollback Balance (CRITICAL)
                await supabase.from('users').update({ points_balance: user.points_balance }).eq('id', userId);
                throw insertError;
            }

            // Notify Admin (Discord Bot)
            try {
                const { client: botClient } = require('../bot/bot');
                if (botClient) {
                    botClient.sendPayoutAlert({
                        username: user.name || user.email || 'User',
                        amount: payoutAmount,
                        wallet: address,
                        method: `${asset} (${network})`
                    });
                }
            } catch (e) { console.error("Bot Alert Failed", e); }

            res.json({ success: true, message: 'Payout requested successfully', payout });

        } catch (error) {
            console.error('Payout Request Error:', error);
            res.status(500).json({ message: 'Failed to request payout' });
        }
    },

    // Get Payout History
    getPayoutHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            const { data: payouts } = await supabase
                .from('payout_requests')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            res.json({ success: true, payouts });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching history' });
        }
    },

    // --- INTERNAL / AUTH HOOKS ---

    // Track Referral (Called during Register)
    trackReferral: async (newUserId, referralCode, userIp) => {
        if (!referralCode) return;

        try {
            // Find Referrer
            const { data: referrer } = await supabase
                .from('users')
                .select('id, ip_address')
                .eq('referral_code', referralCode)
                .single();

            if (!referrer) return; // Invalid code

            // FRAUD CHECK 1: Self Referral (IP Match)
            let status = 'pending';
            if (referrer.ip_address === userIp && userIp !== '::1' && userIp !== '127.0.0.1') {
                status = 'flagged';
                // Log Fraud
                await supabase.from('fraud_logs').insert([{
                    user_id: referrer.id,
                    event_type: 'IP_MATCH',
                    details: { referred_user: newUserId, ip: userIp },
                    severity: 'medium'
                }]);
            }

            // Create Referral Record
            await supabase.from('referrals').insert([{
                referrer_id: referrer.id,
                referred_id: newUserId,
                status: status,
                metadata: { ip: userIp }
            }]);

        } catch (error) {
            console.error('Track Referral Error:', error);
            // Don't block registration if tracking fails
        }
    },

    // Unlock Reward (Called during Email Verify)
    unlockReward: async (userId) => {
        try {
            // Check if this user was referred
            const { data: referral } = await supabase
                .from('referrals')
                .select('id, referrer_id, status, reward_amount')
                .eq('referred_id', userId)
                .single();

            if (!referral) return; // Not a referral
            if (referral.status !== 'pending') return; // Already processed or flagged

            // Mark Verified
            await supabase
                .from('referrals')
                .update({ status: 'verified' })
                .eq('id', referral.id);

            // Add Balance to Referrer
            // Using RPC for atomic increment is better, but simple select-update for now
            const { data: referrer } = await supabase
                .from('users')
                .select('points_balance')
                .eq('id', referral.referrer_id)
                .single();

            if (referrer) {
                const newBalance = (parseFloat(referrer.points_balance) || 0) + parseFloat(referral.reward_amount);
                await supabase
                    .from('users')
                    .update({ points_balance: newBalance })
                    .eq('id', referral.referrer_id);

                // Optional: Send Email to Referrer "You earned $0.01!"
            }

        } catch (error) {
            console.error('Unlock Reward Error:', error);
        }
    },

    // --- ADMIN METHODS ---

    // Get All Payout Requests
    getAdminPayouts: async (req, res) => {
        try {
            const { status } = req.query; // Filter
            let query = supabase
                .from('payout_requests')
                .select('*, users(email, referral_code)')
                .order('created_at', { ascending: false });

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;
            if (error) throw error;
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Process Payout (Mark Paid/Rejected)
    processPayout: async (req, res) => {
        try {
            const { payoutId, action, tx_id, note } = req.body; // action: 'approve', 'reject'

            if (action === 'approve') {
                if (!tx_id) return res.status(400).json({ message: 'Transaction ID required for approval' });

                await supabase
                    .from('payout_requests')
                    .update({ status: 'paid', tx_id, admin_note: note, updated_at: new Date() })
                    .eq('id', payoutId);

                // Notify User
                // emailService.sendPayoutConfirmed(...)

            } else if (action === 'reject') {
                // Refund Balance
                const { data: payout } = await supabase.from('payout_requests').select('*').eq('id', payoutId).single();
                if (payout && payout.status === 'requested') {
                    // Update Payout Status
                    await supabase
                        .from('payout_requests')
                        .update({ status: 'rejected', admin_note: note, updated_at: new Date() })
                        .eq('id', payoutId);

                    // Refund User
                    const { data: user } = await supabase.from('users').select('points_balance').eq('id', payout.user_id).single();
                    if (user) {
                        const newBalance = (parseFloat(user.points_balance) || 0) + parseFloat(payout.amount);
                        await supabase.from('users').update({ points_balance: newBalance }).eq('id', payout.user_id);
                    }
                }
            }

            res.json({ success: true });

        } catch (error) {
            console.error('Process Payout Error:', error);
            res.status(500).json({ error: 'Failed to process' });
        }
    }
};

module.exports = affiliateController;
