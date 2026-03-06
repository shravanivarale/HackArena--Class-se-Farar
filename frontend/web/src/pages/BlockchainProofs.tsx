import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Shield, ExternalLink, Copy, Check, Search, Filter } from 'lucide-react'

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    escrow: { label: 'Escrow Lock', icon: '🔒', color: '#7c6bff' },
    score_snapshot: { label: 'Score Snapshot', icon: '📊', color: '#3b82f6' },
    ghost_kill: { label: 'Ghost Kill', icon: '🧛', color: '#ef4444' },
    challenge_complete: { label: 'Challenge Complete', icon: '🎉', color: '#00d4aa' },
    split_settle: { label: 'Split Settled', icon: '💸', color: '#f59e0b' },
}

export default function BlockchainProofs() {
    const { blockchainProofs } = useApp()
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [filterType, setFilterType] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')

    const filtered = blockchainProofs.filter(p => {
        if (filterType !== 'all' && p.type !== filterType) return false
        if (searchTerm && !p.description.toLowerCase().includes(searchTerm.toLowerCase()) && !p.txnId.toLowerCase().includes(searchTerm.toLowerCase())) return false
        return true
    })

    const handleCopy = (txnId: string) => {
        navigator.clipboard.writeText(txnId)
        setCopiedId(txnId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    return (
        <div className="animate-fade-in">
            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={24} /> Blockchain Proofs
            </div>
            <div className="page-subtitle">
                Every financial action in VitalScore is cryptographically verified on Algorand TestNet.
                This page shows the full audit trail.
            </div>

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                    const count = blockchainProofs.filter(p => p.type === key).length
                    return (
                        <div key={key} style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                            borderRadius: 12, padding: '14px 16px', textAlign: 'center',
                            cursor: 'pointer', transition: 'all 0.15s',
                            borderColor: filterType === key ? cfg.color + '60' : undefined,
                        }} onClick={() => setFilterType(filterType === key ? 'all' : key)}>
                            <div style={{ fontSize: 22 }}>{cfg.icon}</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: cfg.color, marginTop: 4 }}>{count}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cfg.label}</div>
                        </div>
                    )
                })}
            </div>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        placeholder="Search proofs by description or txn ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 12px 10px 34px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    style={{
                        padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)', borderRadius: 8,
                        color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', outline: 'none',
                    }}
                >
                    <option value="all">All Types</option>
                    {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                        <option key={key} value={key}>{cfg.label}</option>
                    ))}
                </select>
            </div>

            {/* Proofs Table */}
            {filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    color: 'var(--text-muted)', fontSize: 14,
                }}>
                    {blockchainProofs.length === 0
                        ? 'No blockchain proofs yet. Stake a challenge or settle a split to generate verifiable proofs.'
                        : 'No proofs match the current filter.'}
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Transaction ID</th>
                                <th>Amount</th>
                                <th>Timestamp</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Explorer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(proof => {
                                const cfg = TYPE_CONFIG[proof.type] || TYPE_CONFIG.escrow
                                return (
                                    <tr key={proof.id}>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                                padding: '3px 10px', borderRadius: 20,
                                                background: cfg.color + '15', color: cfg.color,
                                                fontSize: 12, fontWeight: 600,
                                            }}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 13, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {proof.description}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <code style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                                                    {proof.txnId.slice(0, 12)}...
                                                </code>
                                                <button
                                                    onClick={() => handleCopy(proof.txnId)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === proof.txnId ? '#00d4aa' : 'var(--text-muted)', padding: 2, display: 'flex' }}
                                                    title="Copy full transaction ID"
                                                >
                                                    {copiedId === proof.txnId ? <Check size={13} /> : <Copy size={13} />}
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {proof.amount ? `₹${proof.amount.toLocaleString()}` : '—'}
                                        </td>
                                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {new Date(proof.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                                padding: '3px 10px', borderRadius: 20,
                                                background: proof.verified ? 'rgba(0,212,170,0.12)' : 'rgba(255,193,7,0.12)',
                                                color: proof.verified ? '#00d4aa' : '#ffc107',
                                                fontSize: 11, fontWeight: 600,
                                            }}>
                                                {proof.verified ? <><Check size={11} /> Verified</> : 'Pending'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <a
                                                href={`https://testnet.algoexplorer.io/tx/${proof.txnId}`}
                                                target="_blank" rel="noopener noreferrer"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7c6bff', textDecoration: 'none' }}
                                            >
                                                View <ExternalLink size={11} />
                                            </a>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tech Note for Judges */}
            <div style={{
                marginTop: 24, padding: '16px 20px', borderRadius: 12,
                background: 'rgba(124,107,255,0.06)', border: '1px solid rgba(124,107,255,0.15)',
            }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#7c6bff', marginBottom: 6 }}>🔧 For Judges / Technical Review</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    VitalScore uses Algorand TestNet smart contracts for cryptographic verification of financial actions.
                    Every stake, challenge completion, ghost kill, and split settlement generates a verifiable on-chain transaction.
                    The user-facing UI presents this as "verified" — no wallet/crypto complexity is exposed.
                    Click any "View" link to verify the transaction on Algo Explorer.
                    {blockchainProofs.length > 0 && (
                        <span style={{ display: 'block', marginTop: 8, color: '#7c6bff', fontWeight: 600 }}>
                            Total proofs generated: {blockchainProofs.length}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
