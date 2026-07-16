import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Nav from './components/Nav'
import UpgradeModal from './components/UpgradeModal'
import ToastHost from './components/Toast'
import Marketing from './pages/Marketing'
import Dashboard from './pages/Dashboard'
import Vault from './pages/Vault'
import Resume from './pages/Resume'
import Inbox from './pages/Inbox'
import Settings from './pages/Settings'
import Privacy from './pages/Privacy'
import ResetPassword from './pages/ResetPassword'

function Protected({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="font-display italic text-xl text-stone animate-soft-pulse">Pressed</span>
      </div>
    )
  }
  if (!session) return <Navigate to={`/?auth=login&next=${encodeURIComponent(location.pathname)}`} replace />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen bg-paper">
      <Nav />
      <UpgradeModal />
      <ToastHost />
      <Routes>
        <Route path="/" element={<Marketing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/vault" element={<Protected><Vault /></Protected>} />
        <Route path="/resume" element={<Protected><Resume /></Protected>} />
        <Route path="/inbox" element={<Protected><Inbox /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
