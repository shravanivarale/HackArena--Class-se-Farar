import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Layout/Sidebar'
import TopBar from './components/Layout/TopBar'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Challenges from './pages/Challenges'
import Squads from './pages/Squads'
import League from './pages/League'
import NFT from './pages/NFT'
import Settings from './pages/Settings'
import SplitSync from './pages/SplitSync'
import FundingPool from './pages/FundingPool'

export default function App() {
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
                        <Route path="/squads" element={<Squads />} />
                        <Route path="/league" element={<League />} />
                        <Route path="/nft" element={<NFT />} />
                        <Route path="/splitsync" element={<SplitSync />} />
                        <Route path="/pools" element={<FundingPool />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </main>
            </div>
        </div>
    )
}
