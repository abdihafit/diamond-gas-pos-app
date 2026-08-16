const toneMap = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  unpaid: 'bg-amber-100 text-amber-700',
}

export default function PaymentStatusBadge({ status }) {
  const normalized = (status ?? 'pending').toLowerCase()
  const tone = toneMap[normalized] ?? 'bg-slate-100 text-slate-700'

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
      {normalized}
    </span>
  )
}
