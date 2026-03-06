import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import HeartbeatVisualizer from '../components/Dashboard/HeartbeatVisualizer'
import { scoreHistory, scoreForecast, getBandConfig, smartNudges } from '../data/mockData'
import { useApp } from '../context/AppContext'
import { TrendingUp, Flame, Zap, ArrowUpRight, Ghost, AlertTriangle, Check, X, ChevronUp, ChevronDown, Clock } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            {payload.map((p: any, i: number) => (
                <div key={i} style={{ fontSize: 14, fontWeight: 600, color: p.color }}>{p.name}: {p.value}</div>
            ))}
        </div>
    )
}

const componentData = [
    { subject: 'Savings', value: 72 },
    { subject: 'Essentials', value: 68 },
    { subject: 'Streak', value: 84 },
    { subject: 'Challenges', value: 90 },
    { subject: 'Debt-Free', value: 60 },
]

const CATEGORY_OPTIONS = [
    'Essential.Groceries', 'Essential.Transportation', 'Essential.Bills', 'Essential.Housing',
    'Essential.Healthcare', 'Essential.Education', 'Essential.Insurance', 'Essential.EMI',
    'Discretionary.DiningOut', 'Discretionary.Shopping', 'Discretionary.Entertainment',
    'Discretionary.Subscriptions', 'Discretionary.Travel', 'Discretionary.PersonalCare',
    'Savings.Investment', 'Savings.EmergencyFund',
]

function getCategoryColor(cat: string) {
    if (cat.startsWith('Essential')) return '#3b82f6'
    if (cat.startsWith('Discretionary')) return '#f59e0b'
    if (cat.startsWith('Savings')) return '#10b981'
    return '#94a3b8'
}

export default function Dashboard() {
    const {
        user, score, transactions, ghosts,
        labelTransaction, cancelGhost, verifyGhost, snoozeGhost,
    } = useApp()

    const band = getBandConfig(score.score)
    const [expandedCard, setExpandedCard] = useState<string | null>(null)

    // ─── Smart Nudges: unlabelled transactions ───
    const nudges = useMemo(() =>
        transactions.filter(tx => tx.needsLabel && !tx.labelConfirmed).map(tx => {
            const m = tx.merchant.toLowerCase()
            let suggested = 'Discretionary.Shopping'
            const alts: string[] = []
            if (tx.amount < 100) { suggested = 'Discretionary.DiningOut'; alts.push('Essential.Groceries', 'Discretionary.Shopping') }
            else if (tx.amount < 500) { suggested = 'Discretionary.DiningOut'; alts.push('Essential.Transportation', 'Discretionary.Shopping') }
            else if (tx.amount < 2000) { suggested = 'Discretionary.Shopping'; alts.push('Essential.Bills', 'Essential.Groceries') }
            else if (tx.amount < 5000) { suggested = 'Essential.Bills'; alts.push('Discretionary.Shopping', 'Essential.Groceries') }
            else { suggested = 'Essential.Housing'; alts.push('Essential.Bills', 'Savings.Investment') }
            if (m.includes('zomato') || m.includes('swiggy') || m.includes('food')) suggested = 'Discretionary.DiningOut'
            if (m.includes('uber') || m.includes('ola') || m.includes('metro')) suggested = 'Essential.Transportation'
            if (m.includes('amazon') || m.includes('flipkart') || m.includes('myntra')) suggested = 'Discretionary.Shopping'
            if (m.includes('netflix') || m.includes('spotify') || m.includes('hotstar')) suggested = 'Discretionary.Subscriptions'
            if (m.includes('dmart') || m.includes('bigbasket') || m.includes('grocer')) suggested = 'Essential.Groceries'
            const conf = 0.55 + Math.random() * 0.35
            const elapsed = Date.now() - new Date(tx.date).getTime()
            const mins = Math.floor(elapsed / 60000)
            const timeAgo = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`
            return { transactionId: tx.id, merchantName: tx.description, amount: tx.amount, suggested, conf, alts, timeAgo }
        }),
        [transactions])

    // ─── SubVampire: active ghosts only ───
    const activeGhosts = ghosts.filter(g => g.status === 'DETECTED')
    const ghostTotal = activeGhosts.reduce((s, g) => s + g.annualWaste, 0)

    // ─── Spending breakdown from live data ───
    const spending = useMemo(() => {
        const essential = transactions.filter(t => t.type === 'DEBIT' && t.category.startsWith('Essential')).reduce((s, t) => s + t.amount, 0)
        const discretionary = transactions.filter(t => t.type === 'DEBIT' && t.category.startsWith('Discretionary')).reduce((s, t) => s + t.amount, 0)
        const income = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0)
        const savings = Math.max(0, income - essential - discretionary)
        const total = essential + discretionary + savings || 1
        return [
            { category: 'Essentials', amount: essential, pct: Math.round(essential / total * 100), color: '#3b82f6' },
            { category: 'Discretionary', amount: discretionary, pct: Math.round(discretionary / total * 100), color: '#f59e0b' },
            { category: 'Savings', amount: savings, pct: Math.round(savings / total * 100), color: 'var(--accent-green)' },
        ]
    }, [transactions])

    const monthlySavings = spending[2]?.amount || 0
    const toggleCard = (key: string) => setExpandedCard(prev => prev === key ? null : key)

    // ─── Nudge dropdown state ───
    const [nudgeDropdown, setNudgeDropdown] = useState<string | null>(null)

    return (
        <div className="animate-fade-in">
            <div className="page-title">Financial Health Dashboard</div>
            <div className="page-subtitle">Good morning, {user?.name || 'User'}! {score.change > 0 ? `Your score improved +${score.change} this week 🎉` : 'Keep going!'}</div>

            {/* Heartbeat Hero */}
            <div style={{ marginBottom: 24 }}>
                <HeartbeatVisualizer score={score.score} />
            </div>

            {/* Expandable Quick Stats */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { key: 'savings', label: 'Monthly Savings', value: `₹${monthlySavings.toLocaleString()}`, change: spending[2]?.pct ? `${spending[2].pct}%` : '—', icon: '💰', color: 'var(--accent-green)' },
                    { key: 'streak', label: 'Streak', value: `${user?.streakDays || 0} Days`, change: 'Active', icon: '🔥', color: '#ffc107' },
                    { key: 'points', label: 'VitalPoints', value: (user?.vitalPoints || 0).toLocaleString(), change: 'This Month', icon: '⚡', color: 'var(--accent-purple)' },
                    { key: 'league', label: 'League Rank', value: user?.league || '—', change: 'Current Tier', icon: '🏆', color: '#ffd700' },
                ].map((stat) => (
                    <div key={stat.key} className="card" style={{ padding: '20px 22px', cursor: 'pointer', transition: 'all 0.3s ease' }} onClick={() => toggleCard(stat.key)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ fontSize: 24 }}>{stat.icon}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span className="stat-chip green" style={{ fontSize: 11 }}>{stat.change}</span>
                                {expandedCard === stat.key ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                            </div>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{stat.label}</div>

                        {/* Expanded detail */}
                        {expandedCard === stat.key && (
                            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', animation: 'fadeIn 0.3s ease' }}>
                                {stat.key === 'savings' && (
                                    <div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Target: ₹25,000/month</div>
                                        <div className="progress-bar" style={{ height: 8, marginBottom: 6 }}>
                                            <div className="progress-fill" style={{ width: `${Math.min(100, (monthlySavings / 25000) * 100)}%`, background: 'var(--accent-green)' }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round((monthlySavings / 25000) * 100)}% of goal reached</div>
                                    </div>
                                )}
                                {stat.key === 'streak' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                                        {Array.from({ length: 14 }, (_, i) => {
                                            const active = i < (user?.streakDays || 0)
                                            return <div key={i} style={{ width: 20, height: 20, borderRadius: 4, background: active ? '#ffc107' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? '#ffc10740' : 'var(--border)'}` }} />
                                        })}
                                    </div>
                                )}
                                {stat.key === 'points' && (
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                        <div style={{ marginBottom: 4 }}>📝 Smart Nudge confirmations: +12 XP each</div>
                                        <div style={{ marginBottom: 4 }}>🏆 Challenge completions: +15-50 XP</div>
                                        <div>💀 Ghost subscriptions killed: +25 XP each</div>
                                    </div>
                                )}
                                {stat.key === 'league' && (
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                        <div>Bronze → Silver → Gold → Platinum</div>
                                        <div style={{ marginTop: 4 }}>Top 10% of league earns "Vital Elite" badge</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Smart Nudge Banner — Pending Categorizations */}
            {smartNudges.length > 0 && (
                <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(255,193,7,0.3)', background: 'rgba(255,193,7,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <span style={{ fontSize: 18 }}>🤔</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#ffc107' }}>Smart Nudge — Categorize Your Spending</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{nudges.length} pending • +12 XP each</span>
                    </div>
                    {nudges.slice(0, 5).map((nudge) => (
                        <div key={nudge.transactionId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                                    Did you just spend ₹{nudge.amount.toLocaleString()} on {nudge.merchantName}?
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    Suggested: <span style={{ color: '#ffc107', fontWeight: 600 }}>{nudge.suggested.split('.')[1]}</span>
                                    <span style={{ opacity: 0.5 }}> ({Math.round(nudge.conf * 100)}% conf) • {nudge.timeAgo}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', position: 'relative' }}>
                                <button
                                    onClick={() => labelTransaction(nudge.transactionId, nudge.suggested, nudge.suggested.split('.')[1])}
                                    style={{ padding: '6px 14px', borderRadius: 6, background: 'var(--accent-green)', color: '#0a0f1c', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                >
                                    <Check size={12} /> Confirm
                                </button>
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setNudgeDropdown(nudgeDropdown === nudge.transactionId ? null : nudge.transactionId)}
                                        style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer' }}
                                    >
                                        Change ▾
                                    </button>
                                    {nudgeDropdown === nudge.transactionId && (
                                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 10, padding: 4, zIndex: 100, width: 220, maxHeight: 240, overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}>
                                            {CATEGORY_OPTIONS.map(cat => (
                                                <div
                                                    key={cat}
                                                    onClick={() => { labelTransaction(nudge.transactionId, cat, cat.split('.')[1]); setNudgeDropdown(null) }}
                                                    style={{ padding: '8px 12px', fontSize: 12, color: getCategoryColor(cat), cursor: 'pointer', borderRadius: 6, fontWeight: 500 }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    {cat.replace('.', ' › ')}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* SubVampire — Ghost Subscription Alerts */}
            {activeGhosts.length > 0 && (
                <div className="card" style={{ marginBottom: 24, border: '1px solid rgba(138,43,226,0.25)', background: 'rgba(138,43,226,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <span style={{ fontSize: 20 }}>🧛</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#c084fc' }}>SubVampire Alert</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                            Draining ₹{Math.round(ghostTotal / 12).toLocaleString()}/mo (₹{ghostTotal.toLocaleString()}/yr)
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                        {activeGhosts.map((ghost) => (
                            <div key={ghost.id} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{ghost.merchant}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: ghost.ghostScore > 80 ? '#ff4757' : '#ffc107', background: ghost.ghostScore > 80 ? 'rgba(255,71,87,0.12)' : 'rgba(255,193,7,0.12)', padding: '2px 8px', borderRadius: 12 }}>
                                        {ghost.ghostScore}% ghost
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                                    ₹{ghost.monthlyAmount}/mo • Unused {ghost.lastUsedDaysAgo} days
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => cancelGhost(ghost.id)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, background: 'linear-gradient(135deg, #c084fc, #8b5cf6)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                        Cancel & Save ₹{ghost.annualWaste.toLocaleString()}/yr
                                    </button>
                                    <button onClick={() => verifyGhost(ghost.id)} style={{ padding: '6px 10px', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: 11, cursor: 'pointer' }}>
                                        I use this
                                    </button>
                                    <button onClick={() => snoozeGhost(ghost.id)} style={{ padding: '6px 8px', borderRadius: 6, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: 11, cursor: 'pointer' }} title="Remind me in 7 days">
                                        <Clock size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Score History Chart */}
                <div className="card">
                    <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingUp size={16} color="var(--accent-green)" /> Score History (7 months)
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={scoreHistory} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={band.color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={band.color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[500, 800]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="score" name="VitalScore" stroke={band.color} strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: band.color, r: 4 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* 30-Day Forecast */}
                <div className="card">
                    <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={16} color="var(--accent-purple)" /> 30-Day Forecast
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={scoreForecast} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ffc107" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#ffc107" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="optimizedGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[700, 820]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="current" name="Current Path" stroke="#ffc107" strokeWidth={2} fill="url(#currentGrad)" strokeDasharray="5 5" />
                            <Area type="monotone" dataKey="optimized" name="If Optimized" stroke="var(--accent-green)" strokeWidth={2} fill="url(#optimizedGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                        💡 Reduce dining out 20% → reach <strong style={{ color: 'var(--accent-green)' }}>795</strong> by Day 30
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Spending Breakdown */}
                <div className="card">
                    <div className="section-title">Spending Breakdown</div>
                    {spending.map((item, i) => (
                        <div key={i} style={{ marginBottom: 14 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.category}</span>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                    ₹{item.amount.toLocaleString()} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({item.pct}%)</span>
                                </span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${item.pct}%`, background: item.color }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Score Components Radar */}
                <div className="card">
                    <div className="section-title">Score Components</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={componentData}>
                            <PolarGrid stroke="rgba(255,255,255,0.08)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                            <Radar name="Score" dataKey="value" stroke={band.color} fill={band.color} fillOpacity={0.15} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Transactions snippet */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div className="section-title" style={{ margin: 0 }}>Recent Transactions</div>
                    <a href="/transactions" style={{ fontSize: 13, color: 'var(--accent-green)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        View All <ArrowUpRight size={14} />
                    </a>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th><th>Description</th><th>Category</th><th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.slice(0, 5).map(tx => (
                            <tr key={tx.id}>
                                <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{tx.date}</td>
                                <td style={{ fontWeight: 500 }}>{tx.description}</td>
                                <td>
                                    <span className="stat-chip" style={{ background: getCategoryColor(tx.category) + '22', color: getCategoryColor(tx.category), fontSize: 11 }}>
                                        {tx.categoryLabel}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 600, color: tx.type === 'CREDIT' ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
