import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('HealthCore Dashboard caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'linear-gradient(180deg, #edf5fb 0%, #dbeafe 100%)',
          fontFamily: "'Poppins', sans-serif",
          color: '#29415d',
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            padding: '36px 32px',
            boxShadow: '0 20px 45px rgba(36, 56, 76, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#fff1f5',
              color: '#d85d7a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <AlertTriangle size={28} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Dashboard View Recovery
            </h2>
            <p style={{ fontSize: '13px', color: '#71849a', lineHeight: 1.6, marginBottom: '24px' }}>
              An unexpected display issue occurred. HealthCore has safeguarded the interface. You can reload the dashboard to restore live and demo analytics.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(90deg, #f34c96, #ad67bd)',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(243, 76, 150, 0.3)',
                }}
              >
                <RotateCcw size={15} /> Reload Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
