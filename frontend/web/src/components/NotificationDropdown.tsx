import { useState, useRef, useEffect } from 'react'
import { Bell, X, Check, Trash2, Zap, Trophy, AlertTriangle, CreditCard, Users, Flame, MessageCircle, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'

const iconMap: Record<string, React.ReactNode> = {
    points: <Zap size={16} color="#00d4aa" />,
    challenge: <Trophy size={16} color="#7c6bff" />,
    nudge: <AlertTriangle size={16} color="#f59e0b" />,
    transaction: <CreditCard size={16} color="#3b82f6" />,
    tier: <Flame size={16} color="#ef4444" />,
    split: <Users size={16} color="#06b6d4" />,
    streak: <Flame size={16} color="#f59e0b" />,
    whatsapp: <MessageCircle size={16} color="#25d366" />,
    info: <Info size={16} color="#94a3b8" />,
}

export default function NotificationDropdown() {
    const { notifications, unreadCount, markNotificationRead, clearAllNotifications } = useApp()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button onClick={() => setOpen(!open)} style={styles.bellBtn}>
                <Bell size={20} />
                {unreadCount > 0 && <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {open && (
                <div style={styles.dropdown}>
                    <div style={styles.header}>
                        <h3 style={{ margin: 0, fontSize: 15, color: '#e2e8f0' }}>Notifications</h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {notifications.length > 0 && (
                                <button onClick={clearAllNotifications} style={styles.clearBtn} title="Clear all">
                                    <Trash2 size={14} /> Clear
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} style={styles.closeBtn}><X size={16} /></button>
                        </div>
                    </div>

                    <div style={styles.list}>
                        {notifications.length === 0 ? (
                            <div style={styles.empty}>No notifications</div>
                        ) : (
                            notifications.slice(0, 20).map(n => (
                                <div key={n.id} onClick={() => markNotificationRead(n.id)} style={{ ...styles.item, background: n.read ? 'transparent' : 'rgba(0,212,170,0.04)' }}>
                                    <div style={styles.iconWrap}>{iconMap[n.type] || iconMap.info}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: n.read ? 400 : 600 }}>{n.title}</span>
                                            {!n.read && <div style={styles.dot} />}
                                        </div>
                                        <p style={{ color: '#7a8ba8', fontSize: 12, margin: '3px 0 0', lineHeight: 1.4 }}>{n.body}</p>
                                        <span style={{ color: '#475569', fontSize: 11 }}>{timeAgo(n.createdAt)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

const styles: Record<string, React.CSSProperties> = {
    bellBtn: { position: 'relative', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 6 },
    badge: { position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' },
    dropdown: { position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 360, maxHeight: 480, background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 14, overflow: 'hidden', zIndex: 1000, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(148,163,184,0.08)' },
    clearBtn: { display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', padding: '4px 8px', borderRadius: 6 },
    closeBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 },
    list: { overflowY: 'auto' as const, maxHeight: 420 },
    item: { display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(148,163,184,0.05)', cursor: 'pointer', transition: 'background 0.15s' },
    iconWrap: { width: 32, height: 32, borderRadius: 8, background: 'rgba(30,41,59,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    dot: { width: 8, height: 8, borderRadius: 4, background: '#00d4aa', flexShrink: 0 },
    empty: { padding: 40, textAlign: 'center' as const, color: '#475569', fontSize: 14 },
}
