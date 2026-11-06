export const statusColor = (s) => {
  switch (s) {
    case 'pending': return '#f59e0b'
    case 'code_revealed': return '#3b82f6'
    case 'code_entered': return '#8b5cf6'
    case 'player_confirmed': return '#10b981'
    case 'completed': return '#10b981'
    case 'rejected': return '#ef4444'
    default: return '#6b7280'
  }
}

export const statusLabel = (s) => {
  switch (s) {
    case 'pending': return 'Pending'
    case 'code_revealed': return 'Code Revealed'
    case 'code_entered': return 'Code Entered'
    case 'player_confirmed': return 'Confirmed'
    case 'completed': return 'Completed'
    case 'rejected': return 'Rejected'
    default: return s
  }
}

export const canAct = (s) => {
  return s === 'pending' || s === 'code_entered'
}
