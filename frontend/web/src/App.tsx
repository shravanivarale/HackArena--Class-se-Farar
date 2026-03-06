import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Sidebar from './components/Layout/Sidebar'
import TopBar from './components/Layout/TopBar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Challenges from './pages/Challenges'
import SplitSync from './pages/SplitSync'
import FundingPool from './pages/FundingPool'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import BlockchainProofs from './pages/BlockchainProofs'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useApp()
    if (!isAuthenticated) return <Navigate to="/login" replace />
    return <>{children}</>
}

export default function App() {
    const { isAuthenticated } = useApp()

    // Auth pages: no sidebar/topbar
    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        )
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <TopBar />
                <main className="page-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/challenges" element={<Challenges />} />
                        <Route path="/splitsync" element={<SplitSync />} />
                        <Route path="/pools" element={<FundingPool />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/proofs" element={<BlockchainProofs />} />
                    </Routes>
                </main>
            </div>
        </div>
    )
}
