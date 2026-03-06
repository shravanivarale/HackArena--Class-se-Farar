import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Search, Plus } from 'lucide-react'

const categories = ['All', 'Income', 'Essential', 'Discretionary', 'Savings']

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

export default function Transactions() {
    const { transactions, addTransaction } = useApp()
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('All')
    const [showAdd, setShowAdd] = useState(false)

    // Add form state
    const [formDesc, setFormDesc] = useState('')
    const [formAmount, setFormAmount] = useState('')
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
    const [formCategory, setFormCategory] = useState('Discretionary.DiningOut')
    const [formType, setFormType] = useState<'DEBIT' | 'CREDIT'>('DEBIT')

    const filtered = transactions.filter(tx => {
        const matchSearch = tx.description.toLowerCase().includes(search.toLowerCase()) || tx.merchant.toLowerCase().includes(search.toLowerCase())
        const matchFilter = filter === 'All'
            || (filter === 'Income' && tx.type === 'CREDIT')
            || (filter !== 'Income' && tx.category.startsWith(filter))
        return matchSearch && matchFilter
    })

    // Real-time computed totals
    const totals = useMemo(() => {
        const income = transactions.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0)
        const spend = transactions.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0)
        return { income, spend, net: income - spend }
    }, [transactions])

    // Today's expenses
    const today = new Date().toISOString().split('T')[0]
    const todayExpenses = transactions.filter(t => t.date === today && t.type === 'DEBIT')
    const todayTotal = todayExpenses.reduce((s, t) => s + t.amount, 0)

    const handleAdd = () => {
        if (!formDesc || !formAmount || Number(formAmount) <= 0) return
        addTransaction({
            description: formDesc,
            merchant: formDesc,
            amount: Number(formAmount),
            type: formType,
            category: formType === 'CREDIT' ? 'Savings.Investment' : formCategory,
            categoryLabel: formType === 'CREDIT' ? 'Income' : formCategory.split('.')[1],
            date: formDate,
        })
        setFormDesc(''); setFormAmount(''); setFormDate(new Date().toISOString().split('T')[0]); setFormCategory('Discretionary.DiningOut'); setFormType('DEBIT')
        setShowAdd(false)
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div className="page-title">Transactions</div>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                    <Plus size={16} /> Add Manual
                </button>
            </div>
            <div className="page-subtitle">All your linked bank transactions, auto-categorized</div>

            {/* Today's expenses banner */}
            {todayExpenses.length > 0 && (
                <div className="card" style={{ marginBottom: 16, padding: '14px 20px', border: '1px solid rgba(0,212,170,0.15)', background: 'rgba(0,212,170,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-green)' }}>📅 Today's Expenses</span>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{todayExpenses.length} transactions</span>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>₹{todayTotal.toLocaleString()}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px' }}>
                    <Search size={15} color="var(--text-muted)" />
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search transactions..."
                        style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, width: '100%', fontFamily: 'inherit' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {categories.map(c => (
                        <button key={c} onClick={() => setFilter(c)} className={`btn ${filter === c ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 16px', fontSize: 13 }}>
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Totals row — real-time computed */}
            <div className="grid-3" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Total Income', value: `₹${totals.income.toLocaleString()}`, color: 'var(--accent-green)' },
                    { label: 'Total Spend', value: `₹${totals.spend.toLocaleString()}`, color: 'var(--accent-red)' },
                    { label: 'Net Savings', value: `₹${totals.net.toLocaleString()}`, color: totals.net >= 0 ? 'var(--accent-purple)' : 'var(--accent-red)' },
                ].map((s, i) => (
                    <div key={i} className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>{s.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Transaction table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th><th>Merchant</th><th>Description</th><th>Category</th><th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(tx => (
                            <tr key={tx.id}>
                                <td style={{ color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{tx.date}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: getCategoryColor(tx.category) + '22',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 13, fontWeight: 700, color: getCategoryColor(tx.category)
                                        }}>
                                            {tx.merchant[0]}
                                        </div>
                                        <span style={{ fontWeight: 500, fontSize: 14 }}>{tx.merchant}</span>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tx.description}</td>
                                <td>
                                    <span className="stat-chip" style={{ background: getCategoryColor(tx.category) + '22', color: getCategoryColor(tx.category) }}>
                                        {tx.categoryLabel}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: tx.type === 'CREDIT' ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                                    {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Manual Modal — fully wired */}
            {showAdd && (
                <div className="modal-overlay" onClick={() => setShowAdd(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Add Manual Transaction</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label className="form-label">Description / Merchant</label>
                                <input className="form-input" placeholder="e.g. Coffee shop" value={formDesc} onChange={e => setFormDesc(e.target.value)} />
                            </div>
                            <div className="grid-2">
                                <div>
                                    <label className="form-label">Amount (₹)</label>
                                    <input className="form-input" type="number" placeholder="0" min="1" value={formAmount} onChange={e => setFormAmount(e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">Date</label>
                                    <input className="form-input" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid-2">
                                <div>
                                    <label className="form-label">Type</label>
                                    <select className="form-input" value={formType} onChange={e => setFormType(e.target.value as 'DEBIT' | 'CREDIT')}>
                                        <option value="DEBIT">Expense (Debit)</option>
                                        <option value="CREDIT">Income (Credit)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Category</label>
                                    <select className="form-input" value={formCategory} onChange={e => setFormCategory(e.target.value)} disabled={formType === 'CREDIT'}>
                                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c.replace('.', ' › ')}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd}>Add Transaction</button>
                            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
