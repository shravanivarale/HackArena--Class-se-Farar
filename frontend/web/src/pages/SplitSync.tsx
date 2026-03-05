import { useState } from 'react'
import { Split, Send, CheckCircle, Clock, AlertCircle, Plus, Bell } from 'lucide-react'
import { activeSplits, splitSyncStats, currentUser } from '../data/mockData'

export default function SplitSync() {
    const [showCreate, setShowCreate] = useState(false)
    const [description, setDescription] = useState('')
    const [totalAmount, setTotalAmount] = useState('')
    const [participants, setParticipants] = useState([{ name: '', phone: '', amount: '' }])

    const addParticipant = () => setParticipants([...participants, { name: '', phone: '', amount: '' }])

    const updateParticipant = (idx: number, field: string, value: string) => {
        const updated = [...participants]
        updated[idx] = { ...updated[idx], [field]: value }
        setParticipants(updated)
    }

    const splitEvenly = () => {
        const total = parseFloat(totalAmount)
        if (!total || participants.length === 0) return
        const perPerson = Math.round((total / (participants.length + 1)) * 100) / 100 // +1 for payer
        setParticipants(participants.map(p => ({ ...p, amount: perPerson.toString() })))
    }

    const handleCreate = () => {
        // In real app, POST to /gamification/splits
        alert(`Split created! WhatsApp notifications sent to ${participants.filter(p => p.phone).length} participants.`)
        setShowCreate(false)
        setDescription('')
        setTotalAmount('')
        setParticipants([{ name: '', phone: '', amount: '' }])
    }

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        <Split size={24} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                        SplitSync
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                        Split bills instantly. Get paid via UPI. Track on blockchain.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    style={{
                        background: 'linear-gradient(135deg, #00d4aa, #4ade80)',
                        border: 'none', borderRadius: 10, padding: '10px 20px',
                        color: '#000', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, fontSize: 14,
                    }}
                >
                    <Plus size={16} /> New Split
                </button>
            </div>

            {/* Stats Bar */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24,
            }}>
                {[
                    { label: 'Total Splits', value: splitSyncStats.totalSplits },
                    { label: 'Settled', value: splitSyncStats.settledSplits },
                    { label: 'On-Time Rate', value: `${(splitSyncStats.onTimeRate * 100).toFixed(0)}%` },
                    { label: 'Total Settled', value: `₹${splitSyncStats.totalSettled.toLocaleString()}` },
                    { label: 'Split Streak', value: `${splitSyncStats.splitStreak} 🔥` },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                        borderRadius: 12, padding: '14px 16px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                            {stat.value}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Split Form */}
            {showCreate && (
                <div style={{
                    background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: 16, padding: 24, marginBottom: 24,
                }}>
                    <h3 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: 16 }}>
                        Create New Split
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        <input
                            placeholder="Description (e.g., Dinner at Taj)"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            style={inputStyle}
                        />
                        <input
                            placeholder="Total Amount (₹)"
                            type="number"
                            value={totalAmount}
                            onChange={e => setTotalAmount(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ color: 'var(--text-secondary)', margin: 0 }}>Participants</h4>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={splitEvenly} style={btnSecondary}>Split Evenly</button>
                            <button onClick={addParticipant} style={btnSecondary}>
                                <Plus size={14} /> Add
                            </button>
                        </div>
                    </div>

                    {participants.map((p, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                            <input
                                placeholder="Name"
                                value={p.name}
                                onChange={e => updateParticipant(idx, 'name', e.target.value)}
                                style={inputStyle}
                            />
                            <input
                                placeholder="Phone (+91...)"
                                value={p.phone}
                                onChange={e => updateParticipant(idx, 'phone', e.target.value)}
                                style={inputStyle}
                            />
                            <input
                                placeholder="Amount (₹)"
                                type="number"
                                value={p.amount}
                                onChange={e => updateParticipant(idx, 'amount', e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    ))}

                    <button onClick={handleCreate} style={{
                        ...btnPrimary,
                        width: '100%', marginTop: 12, padding: '12px 0',
                    }}>
                        <Send size={16} /> Create Split & Send WhatsApp Notifications
                    </button>
                </div>
            )}

            {/* Active Splits */}
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                Active Splits
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeSplits.map(split => (
                    <div key={split.id} style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                        borderRadius: 14, padding: 20,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {split.description}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                    by {split.payer} · {new Date(split.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                                    ₹{split.totalAmount.toLocaleString()}
                                </div>
                                <StatusBadge status={split.status} />
                            </div>
                        </div>

                        {/* Participants */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {split.participants.map((p, idx) => (
                                <div key={idx} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', padding: '8px 12px',
                                    background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {p.status === 'PAID'
                                            ? <CheckCircle size={16} color="#00d4aa" />
                                            : <Clock size={16} color="#ffc107" />
                                        }
                                        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                                            {p.name}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            ₹{p.amount}
                                        </span>
                                        {p.status === 'UNPAID' && (
                                            <button style={{
                                                background: 'rgba(255,193,7,0.15)', border: '1px solid rgba(255,193,7,0.3)',
                                                borderRadius: 6, padding: '4px 10px', color: '#ffc107',
                                                cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}>
                                                <Bell size={12} /> Remind
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* XP Reward */}
                        <div style={{
                            marginTop: 10, fontSize: 12, color: '#00d4aa',
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            ⚡ {split.xpRewardPerPerson} XP per person on settlement
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { color: string; bg: string; icon: any }> = {
        PENDING: { color: '#ffc107', bg: 'rgba(255,193,7,0.15)', icon: Clock },
        PARTIAL: { color: '#ffc107', bg: 'rgba(255,193,7,0.15)', icon: AlertCircle },
        SETTLED: { color: '#00d4aa', bg: 'rgba(0,212,170,0.15)', icon: CheckCircle },
    }
    const c = config[status] || config.PENDING
    const Icon = c.icon
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: c.bg, color: c.color, padding: '3px 8px',
            borderRadius: 6, fontSize: 11, fontWeight: 600, marginTop: 4,
        }}>
            <Icon size={12} /> {status}
        </span>
    )
}

const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)',
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
}

const btnSecondary: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '6px 12px', color: 'var(--text-secondary)',
    cursor: 'pointer', fontSize: 12, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 4,
}

const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg, #00d4aa, #4ade80)',
    border: 'none', borderRadius: 10, padding: '10px 20px',
    color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
}
