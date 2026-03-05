-- ============================================================
-- 008_splitsync.sql — SplitSync Bill Splitting Tables
-- VitalScore Finance | Feature: SplitSync
-- ============================================================

-- Splits — records of bill splits initiated by users
CREATE TABLE IF NOT EXISTS splits (
    split_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payer_user_id   UUID NOT NULL REFERENCES user_profiles(user_id),
    total_amount    NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
    currency        VARCHAR(3) NOT NULL DEFAULT 'INR',
    description     TEXT NOT NULL,
    merchant        VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','PARTIAL','SETTLED','TIMEOUT','CANCELLED')),
    algo_app_id     BIGINT,              -- Algorand application ID for on-chain state
    algo_tx_id      VARCHAR(64),         -- Deployment transaction ID
    deadline        TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    xp_reward       INTEGER NOT NULL DEFAULT 15,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Split participants — each person in the split
CREATE TABLE IF NOT EXISTS split_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    split_id        UUID NOT NULL REFERENCES splits(split_id) ON DELETE CASCADE,
    user_id         UUID REFERENCES user_profiles(user_id),
    name            VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),         -- For WhatsApp notification
    amount_owed     NUMERIC(12,2) NOT NULL CHECK (amount_owed > 0),
    paid_status     VARCHAR(20) NOT NULL DEFAULT 'UNPAID'
                    CHECK (paid_status IN ('UNPAID','PAID','CONFIRMED')),
    payment_method  VARCHAR(30),         -- 'UPI', 'GATEWAY', 'CASH'
    payment_ref     VARCHAR(100),        -- UPI transaction ref or gateway ID
    paid_at         TIMESTAMPTZ,
    notified_at     TIMESTAMPTZ,         -- When WhatsApp notification was sent
    reminder_count  INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Split payment links — generated payment links for participants
CREATE TABLE IF NOT EXISTS split_payment_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    split_id        UUID NOT NULL REFERENCES splits(split_id) ON DELETE CASCADE,
    participant_id  UUID NOT NULL REFERENCES split_participants(id) ON DELETE CASCADE,
    payment_url     TEXT NOT NULL,
    upi_deeplink    TEXT,                -- UPI deep link for mobile
    expires_at      TIMESTAMPTZ NOT NULL,
    used            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_splits_payer ON splits(payer_user_id);
CREATE INDEX IF NOT EXISTS idx_splits_status ON splits(status);
CREATE INDEX IF NOT EXISTS idx_splits_created ON splits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_split_participants_split ON split_participants(split_id);
CREATE INDEX IF NOT EXISTS idx_split_participants_user ON split_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_split_participants_status ON split_participants(paid_status);
CREATE INDEX IF NOT EXISTS idx_split_payment_links_split ON split_payment_links(split_id);

-- Trigger: auto-update updated_at on splits
CREATE OR REPLACE FUNCTION update_splits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_splits_updated_at ON splits;
CREATE TRIGGER trg_splits_updated_at
    BEFORE UPDATE ON splits
    FOR EACH ROW
    EXECUTE FUNCTION update_splits_updated_at();
