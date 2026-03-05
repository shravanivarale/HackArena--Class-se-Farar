-- Supporting Tables
-- Additional tables for system functionality

-- Bank connections table
CREATE TABLE bank_connections (
    connection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    account_last_four VARCHAR(4),
    connection_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (connection_status IN ('ACTIVE', 'INACTIVE', 'REVOKED', 'ERROR')),
    razorpay_customer_id VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    consent_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_bank_connections_user ON bank_connections(user_id);
CREATE INDEX idx_bank_connections_status ON bank_connections(connection_status);

-- Streaks tracking table
CREATE TABLE streaks (
    streak_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    streak_type VARCHAR(50) NOT NULL CHECK (streak_type IN ('SAVINGS', 'SCORE_IMPROVEMENT', 'CHALLENGE_COMPLETION')),
    current_streak_days INTEGER NOT NULL DEFAULT 0,
    longest_streak_days INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE NOT NULL,
    streak_freezes_remaining INTEGER NOT NULL DEFAULT 2,
    streak_freezes_used_this_month INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT unique_user_streak_type UNIQUE (user_id, streak_type)
);

CREATE INDEX idx_streaks_user ON streaks(user_id);
CREATE INDEX idx_streaks_type ON streaks(streak_type);

-- Badges table
CREATE TABLE badges (
    badge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    badge_type VARCHAR(100) NOT NULL,
    badge_name VARCHAR(255) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB,
    
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_badges_user ON badges(user_id);
CREATE INDEX idx_badges_type ON badges(badge_type);
CREATE INDEX idx_badges_earned_at ON badges(earned_at DESC);

-- Leaderboards table (cached rankings)
CREATE TABLE leaderboards (
    leaderboard_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    league_id VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL,
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    week_start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT unique_league_user_week UNIQUE (league_id, user_id, week_start_date)
);

CREATE INDEX idx_leaderboards_league_week ON leaderboards(league_id, week_start_date, rank);
CREATE INDEX idx_leaderboards_user ON leaderboards(user_id);

-- Notifications log table
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at DESC);
CREATE INDEX idx_notifications_read ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Audit log table
CREATE TABLE audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_bank_connections_updated_at BEFORE UPDATE
    ON bank_connections FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE
    ON streaks FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE bank_connections IS 'Stores user bank/UPI connections verified via Razorpay';
COMMENT ON TABLE streaks IS 'Tracks daily savings streaks and other streak types';
COMMENT ON TABLE badges IS 'Stores earned badges and achievements';
COMMENT ON TABLE leaderboards IS 'Cached weekly leaderboard rankings per league';
COMMENT ON TABLE notifications IS 'Log of all notifications sent to users';
COMMENT ON TABLE audit_logs IS 'Audit trail for compliance and security';
