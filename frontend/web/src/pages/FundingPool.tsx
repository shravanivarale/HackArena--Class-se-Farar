import { useState } from 'react'
import { Wallet, Users, TrendingUp, Clock, CheckCircle, ArrowDownCircle, ArrowUpCircle, Plus, Shield, Flame } from 'lucide-react'
import { fundingPools, currentUser } from '../data/mockData'

export default function FundingPool() {
    const [showCreate, setShowCreate] = useState(false)
    const [poolName, setPoolName] = useState('')
    const [minDeposit, setMinDeposit] = useState('')
    const [duration, setDuration] = useState('30')

    const handleCreate = () => {
        alert(`Pool "${poolName}" created! Members can now join and deposit.`)
        setShowCreate(false)
        setPoolName('')
        setMinDeposit('')
        setDuration('30')
    }

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        <Wallet size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                        Funding Pools
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                        Commit together, earn together. 90% safe, 10% at stake.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none', borderRadius: 10, padding: '10px 20px',
                        color: '#fff', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 14,
                    }}
                >
                    <Plus size={16} /> Create Pool
                </button>
            </div>

            {/* How It Works */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24,
            }}>
                {[
                    { icon: <Shield size={20} color="#6366f1" />, title: '90% Safe', desc: 'Gets locked — always returned to you' },
                    { icon: <Flame size={20} color="#ef4444" />, title: '10% Risk', desc: 'Forfeit if you leave early — shared among stayers' },
                    { icon: <TrendingUp size={20} color="#00d4aa" />, title: 'Earn More', desc: 'Stay to the end = get your share of the risk pool' },
                ].map((item, i) => (
                    <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                        borderRadius: 12, padding: 16, textAlign: 'center',
                    }}>
                        <div style={{ marginBottom: 8 }}>{item.icon}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                            {item.desc}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Pool Form */}
            {showCreate && (
                <div style={{
                    background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 16, padding: 24, marginBottom: 24,
                }}>
                    <h3 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: 16 }}>
                        Create New Pool
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <input placeholder="Pool Name" value={poolName}
                            onChange={e => setPoolName(e.target.value)} style={inputStyle} />
                        <input placeholder="Min Deposit (₹)" type="number" value={minDeposit}
                            onChange={e => setMinDeposit(e.target.value)} style={inputStyle} />
                        <select value={duration} onChange={e => setDuration(e.target.value)} style={inputStyle}>
                            <option value="7">7 Days</option>
                            <option value="14">14 Days</option>
                            <option value="30">30 Days</option>
                            <option value="60">60 Days</option>
                            <option value="90">90 Days</option>
                        </select>
                    </div>
                    <button onClick={handleCreate} style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none', borderRadius: 10, padding: '12px 0',
                        color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14,
                        width: '100%', marginTop: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                        <Wallet size={16} /> Create Pool on Algorand
                    </button>
                </div>
            )}

            {/* Pool List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {fundingPools.map(pool => {
                    const endDate = new Date(pool.endTime)
                    const now = new Date()
                    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                    const isActive = pool.status === 'ACTIVE'
                    const riskPoolDisplay = pool.riskPool.toLocaleString()

                    return (
                        <div key={pool.id} style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                            borderRadius: 14, padding: 20, overflow: 'hidden',
                        }}>
                            {/* Pool Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {pool.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                        Created by {pool.creator} · {pool.members.length} members
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <PoolStatusBadge status={pool.status} />
                                    {isActive && (
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                            <Clock size={12} style={{ verticalAlign: 'middle' }} /> {daysLeft}d left
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pool Stats */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16,
                            }}>
                                <StatBox label="Total Pool" value={`₹${pool.totalDeposited.toLocaleString()}`} />
                                <StatBox label="Risk Pool" value={`₹${riskPoolDisplay}`} color="#ef4444" />
                                <StatBox label="Min Deposit" value={`₹${pool.minDeposit.toLocaleString()}`} />
                            </div>

                            {/* Members */}
                            <div style={{ marginBottom: 12 }}>
                                <h4 style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 8px 0' }}>
                                    <Users size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                    Members
                                </h4>
                                {pool.members.map((m, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', padding: '8px 12px',
                                        background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                                        marginBottom: 4,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <MemberStatusIcon status={m.status} />
                                            <div>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
                                                    {m.name}
                                                </span>
                                                {m.status === 'WITHDRAWN' && (
                                                    <span style={{ fontSize: 10, color: '#ef4444', marginLeft: 6 }}>withdrew early</span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    ₹{m.deposited.toLocaleString()}
                                                </div>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                                    <span style={{ color: '#6366f1' }}>Safe: ₹{m.safe}</span>
                                                    {' · '}
                                                    <span style={{ color: '#ef4444' }}>Risk: ₹{m.risk}</span>
                                                </div>
                                            </div>
                                            {'payout' in m && (m as any).payout !== undefined && (
                                                <div style={{
                                                    background: (m as any).payout > m.deposited ? 'rgba(0,212,170,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: (m as any).payout > m.deposited ? '#00d4aa' : '#ef4444',
                                                    padding: '3px 8px', borderRadius: 6,
                                                    fontSize: 11, fontWeight: 700,
                                                }}>
                                                    {(m as any).payout > m.deposited ? '+' : ''}₹{(m as any).payout.toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Buttons */}
                            {isActive && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button style={{
                                        flex: 1, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                                        borderRadius: 8, padding: '10px 0', color: '#6366f1',
                                        cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    }}>
                                        <ArrowDownCircle size={16} /> Deposit
                                    </button>
                                    <button style={{
                                        flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                        borderRadius: 8, padding: '10px 0', color: '#ef4444',
                                        cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    }}>
                                        <ArrowUpCircle size={16} /> Withdraw Early
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function PoolStatusBadge({ status }: { status: string }) {
    const config: Record<string, { color: string; bg: string }> = {
        ACTIVE: { color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
        COMPLETED: { color: '#00d4aa', bg: 'rgba(0,212,170,0.15)' },
        DISTRIBUTING: { color: '#ffc107', bg: 'rgba(255,193,7,0.15)' },
    }
    const c = config[status] || config.ACTIVE
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: c.bg, color: c.color, padding: '3px 8px',
            borderRadius: 6, fontSize: 11, fontWeight: 600,
        }}>
            {status === 'COMPLETED' ? <CheckCircle size={12} /> : <Clock size={12} />}
            {status}
        </span>
    )
}

function MemberStatusIcon({ status }: { status: string }) {
    if (status === 'ACTIVE') return <CheckCircle size={16} color="#00d4aa" />
    if (status === 'WITHDRAWN') return <ArrowUpCircle size={16} color="#ef4444" />
    if (status === 'COMPLETED') return <CheckCircle size={16} color="#6366f1" />
    return <Clock size={16} color="#ffc107" />
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 12px',
            textAlign: 'center',
        }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: color || 'var(--text-primary)' }}>
                {value}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
        </div>
    )
}

const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)',
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
}
