import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, Search, Bell, ChevronDown, UserRound, CalendarDays, Sparkles, X, Loader2, Bot } from 'lucide-react'
import { askAssistant, subscribeBackendStatus } from '../services/api'
import GeographicMap from './GeographicMap'

const META = {
  '/':           { title: '',                             sub: '' },
  '/patients':   { title: 'Patient Intelligence',        sub: 'Patient demographics, demand and admission insights' },
  '/finance':    { title: 'Financial Intelligence',      sub: 'Revenue, billing and financial performance' },
  '/operations': { title: 'Operational Intelligence',    sub: 'Beds, staff and resource utilization' },
}

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation()
  const meta = META[pathname] ?? { title: 'Dashboard', sub: '' }
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })

  const [connected, setConnected] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)
  const [showPopover, setShowPopover] = useState(false)
  const [history, setHistory] = useState([])

  const popoverRef = useRef(null)

  useEffect(() => {
    return subscribeBackendStatus(setConnected)
  }, [])


  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const submitQuery = async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const isNearbyRequest = /near me|nearby|nearest hospital/i.test(trimmed)
    let location = {}
    if (isNearbyRequest && navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 300000 }))
        location = { latitude: position.coords.latitude, longitude: position.coords.longitude }
      } catch { /* The backend returns a useful location-permission alternative. */ }
    }
    setLoading(true)
    setError(null)
    setShowPopover(true)
    setResponse(null)
    try {
      const res = await askAssistant(trimmed, { history, ...location })
      setResponse(res.data)
      setHistory(previous => [...previous, { role: 'user', content: trimmed }, { role: 'assistant', content: res.data.answer }].slice(-8))
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to analyze data. Please check backend connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    submitQuery(query)
  }

  const handleChipClick = (sampleQuery) => {
    setQuery(sampleQuery)
    submitQuery(sampleQuery)
  }

  return (
    <header className={`header${pathname === '/' ? ' overview-header' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onMenuClick}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, color: 'var(--muted)' }}
          className="mobile-menu-btn"
        >
          <Menu size={20} />
        </button>
        <div className="header-left">
          <h1>{meta.title}</h1>
          <p>{meta.sub}</p>
        </div>
      </div>

      <div className="header-search-wrap" ref={popoverRef}>
        <form onSubmit={handleSubmit} className="header-search">
          <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--subtle)', padding: 0 }}>
            {loading ? <Loader2 size={15} className="spin-icon" /> : <Sparkles size={15} style={{ color: 'var(--primary)' }} />}
          </button>
          <input
            aria-label="Ask HealthCore AI"
            placeholder="Ask HealthCore AI..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (response || error || loading) setShowPopover(true) }}
          />
        </form>

        {showPopover && (
          <div className="assistant-popover">
            <div className="assistant-popover-header">
              <div className="assistant-badge-title">
                <Bot size={16} className="assistant-icon" />
                <span>HealthCore AI Assistant</span>
              </div>
              <button onClick={() => setShowPopover(false)} className="assistant-close-btn" aria-label="Close panel">
                <X size={14} />
              </button>
            </div>

            <div className="assistant-popover-body">
              {loading && (
                <div className="assistant-loading">
                  <Loader2 size={18} className="spin-icon" />
                  <span>Analysing HealthCore PostgreSQL data...</span>
                </div>
              )}

              {error && (
                <div className="assistant-error">
                  <p>{error}</p>
                </div>
              )}

              {!loading && response && (
                <div className="assistant-result">
                  <div className="assistant-query-tag">Q: "{response.query}"</div>
                  <div className="assistant-answer">
                    {response.answer.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                  {response.category === 'nearby' && response.user_location && (
                    <GeographicMap userLocation={response.user_location} nearbyPlaces={response.nearby_places} assistantMode />
                  )}
                </div>
              )}

              <div className="assistant-suggestions">
                <small>Suggested questions:</small>
                <div className="assistant-chips">
                  {(response?.suggestions?.length ? response.suggestions : ["How many total patients are there?", "Which department has the highest patient demand?", "What is the total revenue?", "What is the current bed utilization?"]).map(suggestion => <button key={suggestion} type="button" onClick={() => handleChipClick(suggestion)}>{suggestion}</button>)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="header-right">
        <span className={`status-pill ${connected ? 'status-live' : 'status-demo'}`} title={connected ? "Connected to PostgreSQL backend" : "Demo Mode: Displaying data from local fallback cache. Set VITE_API_BASE_URL in your hosting provider to connect live backend."}>
          <span className="status-indicator-dot" />
          {connected ? 'Live PostgreSQL' : 'Demo Mode'}
        </span>
        <span className="header-date"><CalendarDays size={13} />{today}</span>
        <button className="header-icon-btn" aria-label="Notifications"><Bell size={16} /><span className="notification-dot" /></button>
        <div className="profile-chip"><span className="profile-avatar"><UserRound size={14} /></span><span className="profile-copy"><strong>Manoj</strong><small>Administrator</small></span><ChevronDown size={14} /></div>
      </div>
      <style>{`
        .mobile-menu-btn { display: none; }
        @media(max-width:768px){ .mobile-menu-btn { display: flex !important; } }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  )
}
