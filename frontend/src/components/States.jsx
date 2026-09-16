import { Loader2, AlertCircle, InboxIcon } from 'lucide-react'

export function LoadingState({ message = 'Loading data…' }) {
  return (
    <div className="state-box">
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
      <p>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function ErrorState({ message = 'Failed to load data. Please try again.' }) {
  return (
    <div className="state-box" style={{ color: '#dc2626' }}>
      <AlertCircle size={28} />
      <p>{message}</p>
    </div>
  )
}

export function EmptyState({ message = 'No data available.' }) {
  return (
    <div className="state-box">
      <InboxIcon size={28} />
      <p>{message}</p>
    </div>
  )
}
