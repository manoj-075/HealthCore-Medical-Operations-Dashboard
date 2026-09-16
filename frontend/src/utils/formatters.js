export const fmt = {
  number: (v) => v == null ? '—' : Number(v).toLocaleString('en-IN'),
  currency: (v) => {
    if (v == null) return '—'
    const n = Number(v)
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr'
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L'
    return '₹' + n.toLocaleString('en-IN')
  },
  pct: (v) => v == null ? '—' : Number(v).toFixed(1) + '%',
  days: (v) => v == null ? '—' : Number(v).toFixed(1) + ' days',
  date: (v) => {
    if (!v) return '—'
    return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  },
}

export const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d']

export const CHART_COLORS = {
  primary: '#e36f9a',
  success: '#4f947e',
  warning: '#c48a49',
  danger:  '#cc5c68',
  purple:  '#8b7aa8',
  cyan:    '#6aa9c9',
}
