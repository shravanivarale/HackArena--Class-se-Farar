import { useState, useMemo } from 'react'
import { Split, Send, CheckCircle, Clock, AlertCircle, Plus, Bell, MessageCircle, Users, X, UserPlus, Star } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function SplitSync() {
    const { splits, createSplit, markSplitPaid, sendSplitReminder, user, friends, addFriend, removeFriend, addNotification } = useApp()

    const [showCreate, setShowCreate] = useState(false)
    const [description, setDescription] = useState('')
    const [totalAmount, setTotalAmount] = useState('')
    const [participants, setParticipants] = useState<{ name: string; phone: string; amount: string }[]>([])
    const [creating, setCreating] = useState(false)
    const [reminding, setReminding] = useState<string | null>(null)

    // Friends management
    const [showAddFriend, setShowAddFriend] = useState(false)
    const [newFriendName, setNewFriendName] = useState('')
    const [newFriendPhone, setNewFriendPhone] = useState('')

    // Sort friends by frequency
    const sortedFriends = useMemo(() =>
        [...friends].sort((a, b) => b.splitCount - a.splitCount),
        [friends])

    const addParticipant = () => setParticipants([...participants, { name: '', phone: '', amount: '' }])

    const addFriendAsParticipant = (friend: typeof friends[0]) => {
        // Don't add if already in list
        if (participants.some(p => p.phone === friend.phone)) return
        setParticipants(prev => [...prev, { name: friend.name, phone: friend.phone, amount: '' }])
    }

    const updateParticipant = (idx: number, field: string, value: string) => {
        const updated = [...participants]
        updated[idx] = { ...updated[idx], [field]: value }
        setParticipants(updated)
    }

    const removeParticipant = (idx: number) => {
        setParticipants(participants.filter((_, i) => i !== idx))
    }

    const splitEvenly = () => {
        const total = parseFloat(totalAmount)
        if (!total || participants.length === 0) return
        const perPerson = Math.round((total / (participants.length + 1)) * 100) / 100
        setParticipants(participants.map(p => ({ ...p, amount: perPerson.toString() })))
    }

    const handleCreate = async () => {
        if (!description || !totalAmount) return
        const validParticipants = participants.filter(p => p.name && p.amount)
        if (validParticipants.length === 0) return
        setCreating(true)
        try {
            await createSplit({
                description,
                totalAmount: Number(totalAmount),
                payer: user?.name || 'You',
                xpRewardPerPerson: 15,
                participants: validParticipants.map(p => ({
                    name: p.name,
                    phone: p.phone || undefined,
                    amount: Number(p.amount),
                    status: 'UNPAID' as const,
                })),
            })
            setShowCreate(false)
            setDescription('')
            setTotalAmount('')
            setParticipants([])
        } finally {
            setCreating(false)
        }
    }

    const handleRemind = async (splitId: string, participantName: string, phone?: string) => {
        if (!phone) {
            addNotification({ type: 'split', title: 'Missing Phone Number', body: `Please add a phone number for ${participantName} to send a WhatsApp reminder.` })
            return
        }
        setReminding(`${splitId}-${participantName}`)
        try {
            await sendSplitReminder(splitId, participantName, phone)
        } finally {
            setReminding(null)
        }
    }

    const handleAddNewFriend = () => {
        if (!newFriendName || !newFriendPhone) return
        addFriend(newFriendName, newFriendPhone)
        setNewFriendName('')
        setNewFriendPhone('')
        setShowAddFriend(false)
    }

    // Stats from real data
    const stats = useMemo(() => {
        const total = splits.length
        const settled = splits.filter(s => s.status === 'SETTLED').length
        const totalSettled = splits.filter(s => s.status === 'SETTLED').reduce((s, sp) => s + sp.totalAmount, 0)
        return { total, settled, onTimeRate: total > 0 ? Math.round((settled / total) * 100) : 0, totalSettled }
    }, [splits])

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
                        Split bills instantly. Pick friends. Get WhatsApp reminders.
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
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24,
            }}>
                {[
                    { label: 'Total Splits', value: stats.total },
                    { label: 'Settled', value: stats.settled },
                    { label: 'On-Time Rate', value: `${stats.onTimeRate}%` },
                    { label: 'Total Settled', value: `₹${stats.totalSettled.toLocaleString()}` },
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

                    {/* ── Frequent Friends Quick-Pick ─────────── */}
                    {sortedFriends.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <Users size={14} color="var(--accent-green)" />
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Frequent Friends</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>— tap to add</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {sortedFriends.map(f => {
                                    const isAdded = participants.some(p => p.phone === f.phone)
                                    return (
                                        <button
                                            key={f.id}
                                            onClick={() => !isAdded && addFriendAsParticipant(f)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 6,
                                                padding: '6px 14px', borderRadius: 20,
                                                border: isAdded ? '1px solid rgba(0,212,170,0.4)' : '1px solid var(--border)',
                                                background: isAdded ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)',
                                                color: isAdded ? '#00d4aa' : 'var(--text-secondary)',
                                                cursor: isAdded ? 'default' : 'pointer',
                                                fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                                            }}
                                        >
                                            {isAdded ? <CheckCircle size={13} /> : <Plus size={13} />}
                                            {f.name}
                                            {f.splitCount > 2 && <Star size={10} color="#ffc107" fill="#ffc107" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ color: 'var(--text-secondary)', margin: 0 }}>Participants ({participants.length})</h4>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={splitEvenly} style={btnSecondary}>Split Evenly</button>
                            <button onClick={addParticipant} style={btnSecondary}>
                                <Plus size={14} /> Add Manually
                            </button>
                        </div>
                    </div>

                    {participants.length === 0 && (
                        <div style={{
                            textAlign: 'center', padding: '20px 16px', color: 'var(--text-muted)',
                            fontSize: 13, border: '1px dashed var(--border)', borderRadius: 10, marginBottom: 12,
                        }}>
                            {sortedFriends.length > 0
                                ? 'Tap a friend above or click "Add Manually" to add participants'
                                : 'Click "Add Manually" to add participants'}
                        </div>
                    )}

                    {participants.map((p, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px auto', gap: 8, marginBottom: 8 }}>
                            <input
                                placeholder="Name"
                                value={p.name}
                                onChange={e => updateParticipant(idx, 'name', e.target.value)}
                                style={inputStyle}
                            />
                            <input
                                placeholder="Phone (+91...) — optional"
                                value={p.phone}
                                onChange={e => updateParticipant(idx, 'phone', e.target.value)}
                                style={inputStyle}
                            />
                            <input
                                placeholder="₹ Amount"
                                type="number"
                                value={p.amount}
                                onChange={e => updateParticipant(idx, 'amount', e.target.value)}
                                style={inputStyle}
                            />
                            <button onClick={() => removeParticipant(idx)} style={{ ...btnSecondary, color: 'var(--accent-red)', padding: '4px 8px' }}>
                                <X size={14} />
                            </button>
                        </div>
                    ))}

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MessageCircle size={14} color="#25D366" />
                        WhatsApp notifications sent automatically to participants with phone numbers
                    </div>

                    <button onClick={handleCreate} disabled={creating || participants.length === 0} style={{
                        ...btnPrimary,
                        width: '100%', marginTop: 4, padding: '12px 0',
                        opacity: creating || participants.length === 0 ? 0.6 : 1,
                    }}>
                        {creating ? '⏳ Creating...' : <><Send size={16} /> Create Split & Notify</>}
                    </button>
                </div>
            )}

            {/* ── Friends Management Section ─────────────── */}
            <div style={{
                background: 'rgba(124,107,255,0.05)', border: '1px solid rgba(124,107,255,0.15)',
                borderRadius: 14, padding: '16px 20px', marginBottom: 24,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sortedFriends.length > 0 || showAddFriend ? 14 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={16} color="#7c6bff" />
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>My Friends</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({friends.length})</span>
                    </div>
                    <button onClick={() => setShowAddFriend(!showAddFriend)} style={{
                        ...btnSecondary, fontSize: 12, padding: '5px 12px',
                        color: showAddFriend ? 'var(--accent-red)' : '#7c6bff',
                    }}>
                        {showAddFriend ? <><X size={13} /> Cancel</> : <><UserPlus size={13} /> Add Friend</>}
                    </button>
                </div>

                {showAddFriend && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                        <input placeholder="Name" value={newFriendName} onChange={e => setNewFriendName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                        <input placeholder="Phone (+91...)" value={newFriendPhone} onChange={e => setNewFriendPhone(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={handleAddNewFriend} style={{ ...btnPrimary, padding: '8px 16px', fontSize: 13 }}>
                            <UserPlus size={14} /> Save
                        </button>
                    </div>
                )}

                {sortedFriends.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {sortedFriends.map(f => (
                            <div key={f.id} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '7px 14px', borderRadius: 10,
                                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #7c6bff, #00d4aa)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 700, color: '#fff',
                                }}>
                                    {f.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{f.name}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{f.splitCount} splits</div>
                                </div>
                                <button onClick={() => removeFriend(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex' }}>
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {sortedFriends.length === 0 && !showAddFriend && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                        Friends are saved automatically when you create splits. Add some manually too!
                    </div>
                )}
            </div>

            {/* Active Splits */}
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                {splits.length > 0 ? 'Your Splits' : 'No splits yet — create one!'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {splits.map(split => (
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            ₹{p.amount}
                                        </span>
                                        {p.status === 'UNPAID' && (
                                            <>
                                                <button
                                                    onClick={() => markSplitPaid(split.id, p.name)}
                                                    style={{
                                                        background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.3)',
                                                        borderRadius: 6, padding: '4px 10px', color: '#00d4aa',
                                                        cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                                        display: 'flex', alignItems: 'center', gap: 4,
                                                    }}
                                                >
                                                    <CheckCircle size={12} /> Mark Paid
                                                </button>
                                                <button
                                                    onClick={() => handleRemind(split.id, p.name, p.phone)}
                                                    disabled={reminding === `${split.id}-${p.name}`}
                                                    style={{
                                                        background: 'rgba(255,193,7,0.15)', border: '1px solid rgba(255,193,7,0.3)',
                                                        borderRadius: 6, padding: '4px 10px', color: '#ffc107',
                                                        cursor: 'pointer', fontSize: 11, fontWeight: 600,
                                                        display: 'flex', alignItems: 'center', gap: 4,
                                                        opacity: reminding === `${split.id}-${p.name}` ? 0.5 : 1,
                                                    }}
                                                >
                                                    <Bell size={12} /> {reminding === `${split.id}-${p.name}` ? 'Sending...' : 'Remind'}
                                                </button>
                                            </>
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
                            ⚡ {split.xpRewardPerPerson || 15} XP per person on settlement
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
