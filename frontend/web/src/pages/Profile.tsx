import { useApp } from '../context/AppContext'
import { useNavigate, Link } from 'react-router-dom'
import { User, Trophy, Flame, Zap, LogOut, Shield, Award, TrendingUp, Wallet, CheckCircle } from 'lucide-react'
import { getBandConfig } from '../data/mockData'

export default function Profile() {
    const { user, score, transactions, challenges, challengeHistory, blockchainProofs, logout } = useApp()
    const navigate = useNavigate()

    if (!user) { navigate('/login'); return null }

    const band = getBandConfig(score.score)
    const totalSpent = transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0)
    const totalIncome = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0)
    const activeChallenges = challenges.filter(c => c.status === 'ACTIVE' || c.status === 'STAKED').length
    const completedChallenges = challengeHistory.filter(h => h.status === 'COMPLETED').length

    const handleLogout = () => { logout(); navigate('/login') }

    return (
        <div style={{ padding: '30px 24px', maxWidth: 800, margin: '0 auto' }}>
            {/* Header */}
            <div style={styles.headerCard}>
                <div style={styles.avatarWrap}>
                    <div style={{ ...styles.avatar, boxShadow: `0 0 30px ${band.color}40` }}>{user.avatar}</div>
                    <div style={{ ...styles.tierBadge, background: band.color + '20', color: band.color, border: `1px solid ${band.color}40` }}>
                        <Shield size={12} /> {score.band || 'No Data'}
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ color: '#e2e8f0', fontSize: 26, fontWeight: 700, margin: 0 }}>{user.name}</h1>
                    <p style={{ color: '#7a8ba8', fontSize: 14, margin: '4px 0 0' }}>{user.email}</p>
                    <p style={{ color: '#64748b', fontSize: 13, margin: '2px 0 0' }}>{user.phone}</p>
                    <div style={styles.tagRow}>
                        <span style={styles.tag}><Trophy size={12} /> {user.league} League</span>
                        <span style={styles.tag}><Flame size={12} /> {user.streakDays} day streak</span>
                    </div>
                </div>
                <div style={styles.scoreCircle}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: band.color }}>{score.score}</span>
                    <span style={{ fontSize: 11, color: '#7a8ba8' }}>VitalScore</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div style={styles.grid}>
                <StatCard icon={<Zap size={20} color="#00d4aa" />} label="Vital Points" value={user.vitalPoints.toLocaleString()} accent="#00d4aa" />
                <StatCard icon={<Trophy size={20} color="#7c6bff" />} label="Challenges Done" value={String(completedChallenges)} accent="#7c6bff" />
                <StatCard icon={<TrendingUp size={20} color="#3b82f6" />} label="Active Challenges" value={String(activeChallenges)} accent="#3b82f6" />
                <StatCard icon={<Award size={20} color="#f59e0b" />} label="Freezes Left" value={String(user.freezesAvailable)} accent="#f59e0b" />
                <StatCard icon={<Wallet size={20} color="#ef4444" />} label="Total Spent" value={`₹${totalSpent.toLocaleString()}`} accent="#ef4444" />
                <StatCard icon={<Wallet size={20} color="#10b981" />} label="Total Income" value={`₹${totalIncome.toLocaleString()}`} accent="#10b981" />
            </div>

            {/* Score Components */}
            <div style={styles.sectionCard}>
                <h3 style={styles.sectionTitle}>Score Breakdown</h3>
                <div style={styles.breakdownGrid}>
                    <BreakdownRow label="Necessity Ratio" value={`${(score.components?.necessityRatio * 100 || 0).toFixed(1)}%`} pct={score.components?.necessityRatio || 0} color="#00d4aa" />
                    <BreakdownRow label="Savings Ratio" value={`${(score.components?.savingsRatio * 100 || 0).toFixed(1)}%`} pct={Math.max(0, score.components?.savingsRatio || 0)} color="#3b82f6" />
                    <BreakdownRow label="Streak Bonus" value={`+${score.components?.streakBonus?.toFixed(0) || 0}`} pct={(score.components?.streakBonus || 0) / 50} color="#f59e0b" />
                    <BreakdownRow label="Challenge Bonus" value={`+${score.components?.challengeBonus?.toFixed(0) || 0}`} pct={(score.components?.challengeBonus || 0) / 100} color="#7c6bff" />
                </div>
            </div>

            {/* Blockchain Verified Badge */}
            <div style={styles.sectionCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: 'rgba(0,212,170,0.12)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <CheckCircle size={22} color="#00d4aa" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#00d4aa' }}>Blockchain Verified ✓</div>
                        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>All financial actions cryptographically verified</div>
                    </div>
                    <Link to="/proofs" style={{
                        fontSize: 12, color: '#7c6bff', textDecoration: 'none',
                        padding: '6px 14px', borderRadius: 8,
                        background: 'rgba(124,107,255,0.1)', border: '1px solid rgba(124,107,255,0.2)',
                        fontWeight: 600,
                    }}>
                        View {blockchainProofs.length} Proofs →
                    </Link>
                </div>
            </div>

            {/* Logout */}
            <button onClick={handleLogout} style={styles.logoutBtn}>
                <LogOut size={18} /> Sign Out
            </button>
        </div>
    )
}

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
    return (
        <div style={{ ...styles.statCard, borderColor: accent + '20' }}>
            {icon}
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>{value}</div>
            <div style={{ fontSize: 12, color: '#7a8ba8' }}>{label}</div>
        </div>
    )
}

function BreakdownRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{label}</span>
                <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{value}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(30,41,59,0.8)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${Math.min(100, pct * 100)}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
            </div>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    headerCard: { display: 'flex', alignItems: 'center', gap: 24, padding: 28, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(0,212,170,0.12)', borderRadius: 16, marginBottom: 24, flexWrap: 'wrap' as const },
    avatarWrap: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8 },
    avatar: { width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #00d4aa, #7c6bff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#fff' },
    tierBadge: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
    tagRow: { display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' as const },
    tag: { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'rgba(30,41,59,0.6)', borderRadius: 20, fontSize: 12, color: '#94a3b8' },
    scoreCircle: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, padding: '18px 22px', background: 'rgba(0,0,0,0.3)', borderRadius: 16, border: '1px solid rgba(124,107,255,0.15)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 },
    statCard: { padding: '18px 16px', background: 'rgba(15,23,42,0.5)', border: '1px solid', borderRadius: 14, display: 'flex', flexDirection: 'column' as const, gap: 6 },
    sectionCard: { padding: '22px 24px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(0,212,170,0.08)', borderRadius: 14, marginBottom: 18 },
    sectionTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: 600, marginBottom: 16, margin: '0 0 16px' },
    breakdownGrid: { display: 'flex', flexDirection: 'column' as const },
    logoutBtn: { width: '100%', padding: '14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, color: '#ef4444', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 },
}
