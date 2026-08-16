import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { signOutUser } from '../firebase/auth'
import { deleteSale, updateSale } from '../firebase/db'
import PaymentStatusBadge from '../components/PaymentStatusBadge'
import { formatDate, formatNumber } from '../lib/formatters'

const toAmount = (sale) => {
  const amount = Number(sale.amount)
  if (Number.isFinite(amount)) return amount
  const kg = Number(sale.kg) || 0
  const rate = Number(sale.rate) || 0
  return kg * rate
}

const toProfit = (sale) => {
  const kg = Number(sale.kg) || 0
  const rate = Number(sale.rate) || 0
  const buyPerKg = Number(sale.buyingPrice) || 0
  return kg * (rate - buyPerKg)
}

const calcTotals = (sales) => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfWeek.getDate() - 6)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  return sales.reduce(
    (acc, sale) => {
      const createdAt = sale.createdAt?.toDate?.() ?? null
      if (!createdAt) return acc
      const amount = toAmount(sale)
      const profit = toProfit(sale)

      if (createdAt >= startOfDay) {
        acc.daily += amount
        acc.dailyProfit += profit
      }
      if (createdAt >= startOfWeek) {
        acc.weekly += amount
        acc.weeklyProfit += profit
      }
      if (createdAt >= startOfMonth) {
        acc.monthly += amount
        acc.monthlyProfit += profit
      }

      return acc
    },
    { daily: 0, weekly: 0, monthly: 0, dailyProfit: 0, weeklyProfit: 0, monthlyProfit: 0 }
  )
}

const SaleRow = memo(function SaleRow({ sale, isUpdating, isUpdated, onMarkPaid, onMarkUnpaid, onDelete }) {
  return (
    <tr className={`odd:bg-white even:bg-slate-50 ${isUpdated ? 'bg-emerald-50' : ''}`}>
      <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-800">
        {sale.customerName}
      </td>
      <td className="border-b border-slate-100 px-4 py-3">
        {formatNumber(Number(sale.kg))}
      </td>
      <td className="border-b border-slate-100 px-4 py-3">
        {formatNumber(Number(sale.rate))}
      </td>
      <td className="border-b border-slate-100 px-4 py-3">
        {formatNumber(Number(sale.buyingPrice ?? 0))} (per KG)
      </td>
      <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">
        {formatNumber(toAmount(sale))}
      </td>
      <td className="border-b border-slate-100 px-4 py-3 font-semibold text-emerald-700">
        {formatNumber(toProfit(sale))}
      </td>
      <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
        <PaymentStatusBadge status={sale.paymentStatus} />
        {isUpdated ? (
          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
            Updated
          </span>
        ) : null}
      </td>
      <td className="border-b border-slate-100 px-4 py-3 text-xs text-slate-400">
        {formatDate(sale.createdAt)}
      </td>
      <td className="border-b border-slate-100 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={(sale.paymentStatus ?? 'pending') === 'paid' || isUpdating}
            onClick={() => onMarkPaid(sale.id)}
            className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 disabled:cursor-not-allowed disabled:border-emerald-200 disabled:text-emerald-500"
          >
            {(sale.paymentStatus ?? 'pending') === 'paid'
              ? 'Paid'
              : isUpdating
                ? 'Updating...'
                : 'Mark Paid'}
          </button>
          {(sale.paymentStatus ?? 'pending') === 'paid' && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onMarkUnpaid(sale.id)}
              className="rounded-md border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:border-amber-300 hover:text-amber-800 disabled:cursor-not-allowed disabled:border-amber-200 disabled:text-amber-400"
            >
              {isUpdating ? 'Updating...' : 'Mark Unpaid'}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(sale.id, sale.customerName)}
            className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  )
})

const toDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toMonthInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const getCsvValue = (value) => {
  if (value === null || value === undefined) return ''
  const text = String(value).replace(/"/g, '""')
  return `"${text}"`
}

export default function AdminDashboard() {
  const [sales, setSales] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [updatedId, setUpdatedId] = useState(null)
  const [newCount, setNewCount] = useState(0)
  const [showAlert, setShowAlert] = useState(false)
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    month: toMonthInput(new Date()),
  })
  const initialLoadRef = useRef(true)

  useEffect(() => {
    const salesQuery = query(collection(db, 'sales'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      salesQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

        if (initialLoadRef.current) {
          initialLoadRef.current = false
          setSales(rows)
          setError('')
          return
        }

        let added = 0
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') added += 1
        })

        setSales(rows)
        setError('')

        if (added > 0) {
          setNewCount((prev) => prev + added)
          setShowAlert(true)
          setTimeout(() => setShowAlert(false), 2200)
        }
      },
      (err) => {
        setError(err.message)
      }
    )

    return () => unsubscribe()
  }, [])

  const filteredSales = useMemo(() => {
    const from = filters.fromDate ? new Date(`${filters.fromDate}T00:00:00`) : null
    const to = filters.toDate ? new Date(`${filters.toDate}T23:59:59`) : null

    let monthStart = null
    let monthEnd = null
    if (filters.month) {
      const [year, month] = filters.month.split('-').map(Number)
      if (year && month) {
        monthStart = new Date(year, month - 1, 1)
        monthEnd = new Date(year, month, 0, 23, 59, 59)
      }
    }

    return sales.filter((sale) => {
      const createdAt = sale.createdAt?.toDate?.() ?? null
      if (!createdAt) return false

      if (monthStart && monthEnd) {
        if (createdAt < monthStart || createdAt > monthEnd) return false
      }

      if (from && createdAt < from) return false
      if (to && createdAt > to) return false

      return true
    })
  }, [filters, sales])

  const totals = useMemo(() => calcTotals(filteredSales), [filteredSales])

  const markPaid = useCallback(async (saleId) => {
    setBusyId(saleId)
    try {
      await updateSale(saleId, { paymentStatus: 'paid' })
      setUpdatedId(saleId)
      setTimeout(() => {
        setUpdatedId((current) => (current === saleId ? null : current))
      }, 1400)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }, [])

  const markUnpaid = useCallback(async (saleId) => {
    setBusyId(saleId)
    try {
      await updateSale(saleId, { paymentStatus: 'pending' })
      setUpdatedId(saleId)
      setTimeout(() => {
        setUpdatedId((current) => (current === saleId ? null : current))
      }, 1400)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }, [])

  const handleDelete = useCallback(async (saleId, name) => {
    const confirmDelete = window.confirm(
      `Delete sale for ${name || 'this customer'}? This cannot be undone.`
    )
    if (!confirmDelete) return

    try {
      await deleteSale(saleId)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const clearBadge = useCallback(() => setNewCount(0), [])

  const handleSignOut = async () => {
    await signOutUser()
  }

  const updateFilter = (field) => (event) => {
    setFilters((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const clearFilters = () => {
    setFilters({ fromDate: '', toDate: '', month: '' })
  }

  const exportCsv = () => {
    const headers = [
      'Customer Name',
      'KG',
      'Rate',
      'Buying Price',
      'Amount',
      'Profit',
      'Payment Status',
      'Payment Method',
      'Date',
    ]

    const rows = filteredSales.map((sale) => [
      sale.customerName,
      sale.kg,
      sale.rate,
      sale.buyingPrice ?? 0,
      toAmount(sale),
      toProfit(sale),
      sale.paymentStatus ?? 'pending',
      sale.paymentMethod ?? 'DTB',
      sale.createdAt?.toDate?.().toISOString() ?? '',
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map(getCsvValue).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'diamond-gas-sales.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Admin Portal</p>
              {newCount > 0 ? (
                <button
                  type="button"
                  onClick={clearBadge}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                >
                  {newCount} new
                </button>
              ) : null}
            </div>
            <h1 className="text-2xl font-semibold text-slate-800">All Sales</h1>
            <p className="mt-1 text-xs text-slate-400">Signed in as Admin</p>
          </div>
          <div className="flex items-center gap-6 text-right text-xs text-slate-400">
            <div>
              <p>Realtime updates</p>
              <p>Excel-style ledger</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {showAlert ? (
        <div className="border-b border-emerald-200 bg-emerald-50">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2 text-sm text-emerald-700">
            <span>New sale received.</span>
            <button
              type="button"
              onClick={() => setShowAlert(false)}
              className="text-xs font-semibold uppercase tracking-wide"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Daily Total</p>
            <p className="mt-3 text-2xl font-semibold text-slate-800">
              {formatNumber(totals.daily)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Profit: {formatNumber(totals.dailyProfit)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Weekly Total</p>
            <p className="mt-3 text-2xl font-semibold text-slate-800">
              {formatNumber(totals.weekly)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Profit: {formatNumber(totals.weeklyProfit)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Monthly Total</p>
            <p className="mt-3 text-2xl font-semibold text-slate-800">
              {formatNumber(totals.monthly)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Profit: {formatNumber(totals.monthlyProfit)}</p>
          </div>
        </section>

        <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">Month</label>
            <input
              type="month"
              value={filters.month}
              onChange={updateFilter('month')}
              className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">From</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={updateFilter('fromDate')}
              className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-slate-400">To</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={updateFilter('toDate')}
              className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Clear Filters
            </button>
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="rounded-md border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            Export PDF
          </button>
          <span className="text-xs text-slate-400">Exports current filtered view.</span>
        </section>

        {error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Sales Ledger
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3">Customer</th>
                  <th className="border-b border-slate-200 px-4 py-3">KG</th>
                  <th className="border-b border-slate-200 px-4 py-3">Rate</th>

                  <th className="border-b border-slate-200 px-4 py-3">Buy Rate (KSh/KG)</th>

                  <th className="border-b border-slate-200 px-4 py-3">Amount</th>
                  <th className="border-b border-slate-200 px-4 py-3">Profit</th>
                  <th className="border-b border-slate-200 px-4 py-3">Status</th>
                  <th className="border-b border-slate-200 px-4 py-3">Date</th>
                  <th className="border-b border-slate-200 px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-6 text-center text-sm text-slate-400"
                    >
                      No sales found for the selected dates.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <SaleRow
                      key={sale.id}
                      sale={sale}
                      isUpdating={busyId === sale.id}
                      isUpdated={updatedId === sale.id}
                      onMarkPaid={markPaid}
                      onMarkUnpaid={markUnpaid}
                      onDelete={handleDelete}
                    />

                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
