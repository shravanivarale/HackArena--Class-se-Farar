import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, Trophy, Users, Award, Shield, Settings, Zap, Split, Wallet } from 'lucide-react'
import { currentScore, getBandConfig } from '../../data/mockData'

const nav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
    { to: '/challenges', icon: Trophy, label: 'Challenges' },
    { to: '/squads', icon: Users, label: 'Squads' },
    { to: '/league', icon: Award, label: 'League' },
    { to: '/nft', icon: Shield, label: 'My NFT' },
    { to: '/splitsync', icon: Split, label: 'SplitSync' },
    { to: '/pools', icon: Wallet, label: 'Pools' },
    { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
    const band = getBandConfig(currentScore.score)

    return (
        <aside style={{
            position: 'fixed', left: 0, top: 0, bottom: 0,
            width: 'var(--sidebar-width)',
            background: 'rgba(8,13,26,0.95)',
            borderRight: '1px solid var(--border)',
            backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column',
            zIndex: 100, padding: '0 12px',
        }}>
            {/* Logo */}
            <div style={{ padding: '20px 12px 24px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `linear-gradient(135deg, ${band.color}, #7c6bff)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 16px ${band.glowColor}`,
                    }}>
                        <Zap size={18} color="#000" strokeWidth={2.5} />
                    </div>
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>VitalScore</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>FINANCE</div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {nav.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
                        {({ isActive }) => (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                                background: isActive ? 'rgba(0,212,170,0.1)' : 'transparent',
                                color: isActive ? band.color : 'var(--text-secondary)',
                                transition: 'all 0.15s',
                                fontSize: 14, fontWeight: isActive ? 600 : 400,
                                borderLeft: isActive ? `3px solid ${band.color}` : '3px solid transparent',
                            }}>
                                <Icon size={17} />
                                {label}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom streak badge */}
            <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)' }}>
                <div style={{
                    background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.2)',
                    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <span style={{ fontSize: 18 }}>🔥</span>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#ffc107' }}>14-Day Streak</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Keep it going!</div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
