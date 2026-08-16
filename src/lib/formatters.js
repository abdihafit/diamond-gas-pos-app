export const formatNumber = (value) =>
  Number.isFinite(value)
    ? value.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '--'

export const formatDate = (timestamp) => {
  if (!timestamp?.toDate) return '--'
  return timestamp.toDate().toLocaleDateString()
}

export const formatDateTime = (timestamp) => {
  if (!timestamp?.toDate) return '--'
  return timestamp.toDate().toLocaleString()
}
