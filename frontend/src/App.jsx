import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Activity, HeartPulse, ShieldPlus, Stethoscope } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Header  from './components/Header'
import ErrorBoundary from './components/ErrorBoundary'
import Overview    from './pages/Overview'
import Patients    from './pages/Patients'
import Finance     from './pages/Finance'
import Operations  from './pages/Operations'

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <ErrorBoundary>
      <BrowserRouter>

      <div className="app-shell">
          <div className="ambient-scene" aria-hidden="true">
            <div className="ambient-photo" />
            <div className="ambient-wash" />
            <div className="hud-panel hud-panel-large"><span>CARE SIGNAL</span><strong>+</strong></div>
            <div className="hud-panel hud-panel-small"><span>HC</span><strong>◈</strong></div>
            <div className="hud-line hud-line-one">╱╲╱╲╱╲╱╲</div>
            <div className="hud-line hud-line-two">╲╱╲╱╲╱╲╱</div>
          </div>
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <div className="main-area">
          <Header onMenuClick={() => setMobileOpen(true)} />
          <main className="page-content">
            <Routes>
              <Route path="/"           element={<Overview />} />
              <Route path="/patients"   element={<Patients />} />
              <Route path="/finance"    element={<Finance />} />
              <Route path="/operations" element={<Operations />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
