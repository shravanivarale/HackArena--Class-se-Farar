import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Clock, Zap, CheckCircle, XCircle, Shield } from 'lucide-react'

const getDifficultyStyle = (d: string) => {
    if (d === 'Easy') return { bg: 'var(--accent-green-dim)', color: 'var(--accent-green)' }
    if (d === 'Medium') return { bg: 'rgba(255,193,7,0.12)', color: '#ffc107' }
    return { bg: 'var(--accent-red-dim)', color: 'var(--accent-red)' }
}

const getDaysLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function Challenges() {
    const { challenges, challengeHistory, joinChallenge, completeChallenge } = useApp()
    const [stakeModal, setStakeModal] = useState<typeof challenges[0] | null>(null)
    const [stakeAmount, setStakeAmount] = useState(200)
    const [staking, setStaking] = useState(false)
    const [stakeConfirmed, setStakeConfirmed] = useState(false)

    const handleStake = async () => {
        if (!stakeModal) return
        setStaking(true)
        try {
            await joinChallenge(stakeModal.id, stakeAmount)
            setStakeConfirmed(true)
            setTimeout(() => setStakeConfirmed(false), 4000)
        } finally {
            setStaking(false)
            setStakeModal(null)
        }
    }

    const activeChallenges = challenges.filter(c => c.status === 'ACTIVE' || c.status === 'STAKED')
    const totalStaked = challenges.reduce((s, c) => s + (c.stakeAmount || 0), 0)

    return (
        <div className="animate-fade-in">
            <div className="page-title">Challenges</div>
            <div className="page-subtitle">Your 3 personalized weekly challenges — stake real money to earn more!</div>

            {/* Stake success confirmation */}
            {stakeConfirmed && (
                <div className="card" style={{ marginBottom: 20, border: '1px solid rgba(0,212,170,0.3)', background: 'rgba(0,212,170,0.06)', padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Shield size={18} color="var(--accent-green)" />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-green)' }}>Stake Secured ✓</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                Your stake is verified and locked. Complete the challenge to earn it back + yield.
                            </div>
                        </div>
                        <button onClick={() => setStakeConfirmed(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
                    </div>
                </div>
            )}

            {/* Community pool banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(124,107,255,0.15), rgba(0,212,170,0.1))',
                border: '1px solid rgba(124,107,255,0.3)',
                borderRadius: 'var(--radius-lg)', padding: '18px 24px',
                display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24,
            }}>
                <div style={{ fontSize: 36 }}>🏦</div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Community Pool Balance</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent-purple)' }}>₹2,40,500</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Stakes securely locked — forfeited stakes grow yield for winners</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Your Total Staked</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-green)' }}>₹{totalStaked.toLocaleString()}</div>
                </div>
            </div>

            {/* Active challenges */}
            <div className="section-title">Active This Week</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                {activeChallenges.map(ch => {
                    const pct = Math.round((ch.currentValue / ch.targetValue) * 100)
                    const diff = getDifficultyStyle(ch.difficulty)
                    const daysLeft = getDaysLeft(ch.deadline)
                    const canComplete = pct >= 100 && ch.status !== 'COMPLETED'
                    return (
                        <div key={ch.id} className="card" style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                                background: diff.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 24,
                            }}>
                                {ch.type === 'REDUCE_CATEGORY' ? '🍕' : ch.type === 'SAVINGS_VELOCITY' ? '💰' : '🛡️'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700 }}>{ch.title}</div>
                                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: diff.bg, color: diff.color }}>{ch.difficulty}</span>
                                    {ch.status === 'STAKED' && (
                                        <span style={{ fontSize: 10, color: 'var(--accent-green)', fontWeight: 500 }}>🔒 Secured</span>
                                    )}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>{ch.description}</div>
                                <div className="progress-bar" style={{ height: 8, marginBottom: 8 }}>
                                    <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? 'var(--accent-green)' : diff.color }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                                    <span>₹{ch.currentValue.toLocaleString()} / ₹{ch.targetValue.toLocaleString()} ({pct}%)</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={12} />{daysLeft} days left
                                    </span>
                                </div>
                            </div>
                            <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>STAKE</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-purple)', marginBottom: 8 }}>₹{ch.stakeAmount}</div>
                                <div style={{ fontSize: 11, color: 'var(--accent-green)', marginBottom: 10 }}>+{ch.scoreBonus} pts on win</div>
                                {canComplete ? (
                                    <button className="btn btn-primary" style={{ fontSize: 12, padding: '8px 16px', background: 'var(--accent-green)' }} onClick={() => completeChallenge(ch.id)}>
                                        <CheckCircle size={13} /> Claim Reward
                                    </button>
                                ) : (
                                    <button className="btn btn-primary" style={{ fontSize: 12, padding: '8px 16px' }} onClick={() => { setStakeModal(ch); setStakeAmount(200) }}>
                                        <Zap size={13} /> Stake More
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Challenge History */}
            <div className="section-title">Challenge History</div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr><th>Challenge</th><th>Difficulty</th><th>Status</th><th>Completed</th><th style={{ textAlign: 'right' }}>Points</th></tr>
                    </thead>
                    <tbody>
                        {challengeHistory.map(ch => (
                            <tr key={ch.id}>
                                <td style={{ fontWeight: 500 }}>{ch.title}</td>
                                <td><span className="badge" style={ch.difficulty === 'Easy' ? { background: 'var(--accent-green-dim)', color: 'var(--accent-green)' } : ch.difficulty === 'Medium' ? { background: 'rgba(255,193,7,0.12)', color: '#ffc107' } : { background: 'var(--accent-red-dim)', color: 'var(--accent-red)' }}>{ch.difficulty}</span></td>
                                <td>
                                    {ch.status === 'COMPLETED'
                                        ? <span className="stat-chip green"><CheckCircle size={12} /> Completed</span>
                                        : <span className="stat-chip red"><XCircle size={12} /> Failed</span>}
                                </td>
                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{ch.completedAt}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: ch.earnedPoints > 0 ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                                    {ch.earnedPoints > 0 ? `+${ch.earnedPoints}` : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Stake Modal — clean fintech language */}
            {stakeModal && (
                <div className="modal-overlay" onClick={() => !staking && setStakeModal(null)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Secure Your Stake</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{stakeModal.title}</p>

                        <div style={{ background: 'var(--accent-purple-dim)', border: '1px solid rgba(124,107,255,0.3)', borderRadius: 8, padding: 14, marginBottom: 20 }}>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>How staking works</div>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                                🔒 Your stake is securely locked and verified<br />
                                ✅ Complete challenge → Stake returned + yield share<br />
                                ❌ Fail → Stake goes to community pool
                            </div>
                        </div>

                        <label className="form-label">Stake Amount (₹50 — ₹{stakeModal.difficulty === 'Hard' ? '1,000' : '500'})</label>
                        <input
                            className="form-input"
                            type="number"
                            min={50} max={stakeModal.difficulty === 'Hard' ? 1000 : 500}
                            value={stakeAmount}
                            onChange={e => setStakeAmount(Number(e.target.value))}
                            style={{ marginBottom: 8 }}
                        />
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                            Your stake will be cryptographically verified and locked until the challenge ends.
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleStake} disabled={staking}>
                                {staking ? '⏳ Securing your stake...' : `🔒 Confirm Stake ₹${stakeAmount}`}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setStakeModal(null)} disabled={staking}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
