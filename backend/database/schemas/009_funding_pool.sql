-- ============================================================
-- 009_funding_pool.sql — Funding Pool (Commitment Pool) Tables
-- VitalScore Finance | Feature: Funding Pool
-- ============================================================

-- Funding pools — commitment pools where 90% safe / 10% risk
CREATE TABLE IF NOT EXISTS funding_pools (
    pool_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    creator_user_id UUID NOT NULL REFERENCES user_profiles(user_id),
    total_deposited NUMERIC(14,2) NOT NULL DEFAULT 0,
    risk_pool       NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Accumulated forfeited risk portions
    member_count    INTEGER NOT NULL DEFAULT 0,
    min_deposit     NUMERIC(12,2) NOT NULL DEFAULT 100,
    max_members     INTEGER NOT NULL DEFAULT 20,
    duration_days   INTEGER NOT NULL CHECK (duration_days > 0),
    start_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time        TIMESTAMPTZ NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE','DISTRIBUTING','COMPLETED','CANCELLED')),
    algo_app_id     BIGINT,              -- Algorand application ID
    algo_tx_id      VARCHAR(64),         -- Deployment transaction ID
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pool members — participants in the funding pool
CREATE TABLE IF NOT EXISTS pool_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id         UUID NOT NULL REFERENCES funding_pools(pool_id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES user_profiles(user_id),
    total_deposited NUMERIC(14,2) NOT NULL DEFAULT 0,
    safe_portion    NUMERIC(14,2) NOT NULL DEFAULT 0,   -- 90% of deposits
    risk_portion    NUMERIC(14,2) NOT NULL DEFAULT 0,   -- 10% of deposits
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE','WITHDRAWN','DISTRIBUTED')),
    withdrawn_at    TIMESTAMPTZ,
    payout_amount   NUMERIC(14,2),       -- Final payout (if stayed till end)
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(pool_id, user_id)
);

-- Pool deposits — individual deposit transactions
CREATE TABLE IF NOT EXISTS pool_deposits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id         UUID NOT NULL REFERENCES funding_pools(pool_id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES user_profiles(user_id),
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    safe_amount     NUMERIC(12,2) NOT NULL, -- 90%
    risk_amount     NUMERIC(12,2) NOT NULL, -- 10%
    algo_tx_id      VARCHAR(64),         -- Algorand transaction ID
    deposited_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pool withdrawals — early withdrawal records
CREATE TABLE IF NOT EXISTS pool_withdrawals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id         UUID NOT NULL REFERENCES funding_pools(pool_id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES user_profiles(user_id),
    safe_returned   NUMERIC(12,2) NOT NULL, -- 90% returned
    risk_forfeited  NUMERIC(12,2) NOT NULL, -- 10% lost
    algo_tx_id      VARCHAR(64),
    withdrawn_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pools_creator ON funding_pools(creator_user_id);
CREATE INDEX IF NOT EXISTS idx_pools_status ON funding_pools(status);
CREATE INDEX IF NOT EXISTS idx_pools_end_time ON funding_pools(end_time);
CREATE INDEX IF NOT EXISTS idx_pool_members_pool ON pool_members(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_members_user ON pool_members(user_id);
CREATE INDEX IF NOT EXISTS idx_pool_members_status ON pool_members(status);
CREATE INDEX IF NOT EXISTS idx_pool_deposits_pool ON pool_deposits(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_deposits_user ON pool_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_pool_withdrawals_pool ON pool_withdrawals(pool_id);

-- Trigger: auto-update updated_at on funding_pools
CREATE OR REPLACE FUNCTION update_pools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pools_updated_at ON funding_pools;
CREATE TRIGGER trg_pools_updated_at
    BEFORE UPDATE ON funding_pools
    FOR EACH ROW
    EXECUTE FUNCTION update_pools_updated_at();
