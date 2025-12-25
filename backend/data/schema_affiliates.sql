-- Phase 1: Affiliate System Database Architecture

-- 1. Updates to 'users' table
-- Check if columns exist first to avoid errors (or just ADD IF NOT EXISTS if supported, else simple ADD)
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS points_balance DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_details JSONB DEFAULT '{}'::jsonb;
-- Example wallet_details: {"USDT": {"network": "ERC20", "address": "0x..."}}

-- Generate random referral codes for existing users (optional, usually done on demand)
-- UPDATE users SET referral_code = LEFT(MD5(random()::text), 8) WHERE referral_code IS NULL;


-- 2. Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, verified, flagged, paid
    reward_amount DECIMAL(10, 2) DEFAULT 0.01,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store IP, device, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);


-- 3. Payout Requests Table
CREATE TABLE IF NOT EXISTS payout_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    asset TEXT NOT NULL, -- USDT, USDC, BTC
    network TEXT NOT NULL, -- ERC20, TRC20, SOL
    address TEXT NOT NULL,
    status TEXT DEFAULT 'requested', -- requested, processing, paid, rejected
    tx_id TEXT, -- Transaction Hash
    admin_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_payouts_user ON payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payout_requests(status);


-- 4. Fraud Logs Table
CREATE TABLE IF NOT EXISTS fraud_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'IP_MATCH', 'RAPID_SIGNUP', 'DEVICE_MATCH'
    details JSONB,
    severity TEXT DEFAULT 'medium', -- low, medium, high, critical
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RLS Policies (Basic Draft)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- Users can read their own referrals
CREATE POLICY "Users can view their own referrals" ON referrals
    FOR SELECT USING (auth.uid() = referrer_id);

-- Users can read their own payouts
CREATE POLICY "Users can view their own payouts" ON payout_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert payout requests (if authenticated)
CREATE POLICY "Users can request payouts" ON payout_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins (Service Role) have full access - (Implicit locally, but explicit needed for Supabase client if not using service role)
-- We use Service Role Key in backend, so RLS is bypassed there.
