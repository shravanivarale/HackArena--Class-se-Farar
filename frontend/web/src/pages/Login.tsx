import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ArrowRight, Eye, EyeOff, Activity } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Login() {
    const { login } = useApp()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) { setError('Please fill in all fields'); return }
        setLoading(true); setError('')
        const ok = await login(email, password)
        setLoading(false)
        if (ok) navigate('/dashboard')
        else setError('Invalid email or password. Please sign up first.')
    }

    return (
        <div style={styles.container}>
            <div style={styles.bgGrid} />
            <div style={styles.card}>
                <div style={styles.logo}>
                    <Activity size={32} color="#00d4aa" />
                    <span style={styles.logoText}>VitalScore</span>
                </div>
                <h1 style={styles.heading}>Welcome Back</h1>
                <p style={styles.sub}>Your financial health, measured like your heartbeat</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <label style={styles.label}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={styles.input} autoComplete="email" />

                    <label style={styles.label}>Password</label>
                    <div style={styles.pwWrap}>
                        <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...styles.input, paddingRight: 44 }} autoComplete="current-password" />
                        <button type="button" onClick={() => setShowPw(!showPw)} style={styles.eyeBtn}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>

                    {error && <p style={styles.error}>{error}</p>}

                    <button type="submit" disabled={loading} style={styles.btn}>
                        {loading ? 'Signing in...' : 'Sign In'}
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <p style={styles.footer}>
                    Don't have an account? <Link to="/signup" style={styles.link}>Sign Up</Link>
                </p>

                <div style={styles.pulse}>
                    <Heart size={14} color="#00d4aa" />
                    <span style={{ fontSize: 11, color: '#7a8ba8' }}>Secure authentication powered by VitalScore</span>
                </div>
            </div>
        </div>
    )
}

const styles: Record<string, React.CSSProperties> = {
    container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080d1a', position: 'relative', overflow: 'hidden', padding: 20 },
    bgGrid: { position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,212,170,0.06) 1px, transparent 0)', backgroundSize: '40px 40px' },
    card: { position: 'relative', width: '100%', maxWidth: 420, background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 16, padding: '40px 36px', backdropFilter: 'blur(16px)' },
    logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
    logoText: { fontSize: 22, fontWeight: 700, color: '#e2e8f0', letterSpacing: '-0.5px' },
    heading: { color: '#e2e8f0', fontSize: 28, fontWeight: 700, marginBottom: 6 },
    sub: { color: '#7a8ba8', fontSize: 14, marginBottom: 28 },
    form: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
    label: { color: '#94a3b8', fontSize: 13, fontWeight: 500, marginTop: 10 },
    input: { width: '100%', padding: '12px 14px', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 10, color: '#e2e8f0', fontSize: 15, outline: 'none', boxSizing: 'border-box' as const },
    pwWrap: { position: 'relative' as const },
    eyeBtn: { position: 'absolute' as const, right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 },
    error: { color: '#f87171', fontSize: 13, margin: '6px 0 0' },
    btn: { width: '100%', marginTop: 20, padding: '13px 0', background: 'linear-gradient(135deg, #00d4aa, #7c6bff)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
    footer: { textAlign: 'center' as const, marginTop: 24, color: '#7a8ba8', fontSize: 14 },
    link: { color: '#00d4aa', textDecoration: 'none', fontWeight: 600 },
    pulse: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 20 },
}
