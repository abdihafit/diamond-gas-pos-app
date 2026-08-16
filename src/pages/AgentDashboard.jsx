import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'
import { signOutUser } from '../firebase/auth'
import { createSale, updateSale } from '../firebase/db'
import PaymentStatusBadge from '../components/PaymentStatusBadge'
import TableEmptyState from '../components/TableEmptyState'
import { formatDateTime, formatNumber } from '../lib/formatters'

const defaultForm = {
  customerName: '',
  kg: '',
  rate: '',
  buyingPrice: '',
  saleDate: '',
}

const toInputDate = (timestamp) => {
  if (!timestamp?.toDate) return ''
  const date = timestamp.toDate()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const SaleRow = memo(function SaleRow({ sale, onEdit }) {
  return (
    <tr className="odd:bg-white even:bg-slate-50">
      <td className="border-b border-slate-100 px-4 py-3 font-medium text-slate-800">
        {sale.customerName}
      </td>
      <td className="border-b border-slate-100 px-4 py-3">
        {formatNumber(sale.kg)}
      </td>
      <td className="border-b border-slate-100 px-4 py-3">
        {formatNumber(sale.rate)}
      </td>
      <td className="border-b border-slate-100 px-4 py-3">
        {formatNumber(sale.buyingPrice ?? 0)}
      </td>
      <td className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">
        {formatNumber(sale.amount)}
      </td>
      <td className="border-b border-slate-100 px-4 py-3">
        {sale.paymentMethod ?? 'DTB'}
      </td>
      <td className="border-b border-slate-100 px-4 py-3 text-slate-600">
        <PaymentStatusBadge status={sale.paymentStatus} />
      </td>
      <td className="border-b border-slate-100 px-4 py-3 text-xs text-slate-400">
        {formatDateTime(sale.createdAt)}
      </td>
      <td className="border-b border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={() => onEdit(sale)}
          className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
        >
          Edit
        </button>
      </td>
    </tr>
  )
})

export default function AgentDashboard() {
  const [form, setForm] = useState(defaultForm)
  const [sales, setSales] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)

  const kgValue = Number(form.kg) || 0
  const rateValue = Number(form.rate) || 0
  const buyRateValue = Number(form.buyingPrice) || 0
  const buyAmountValue = useMemo(() => kgValue * buyRateValue, [kgValue, buyRateValue])
  const amountValue = useMemo(() => kgValue * rateValue, [kgValue, rateValue])

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      setSales([])
      setError('Sign in to load your sales.')
      return () => undefined
    }

    const salesQuery = query(
      collection(db, 'sales'),
      where('createdBy', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      salesQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setSales(rows)
        setError('')
      },
      (err) => {
        setError(err.message)
      }
    )

    return () => unsubscribe()
  }, [])

  const updateField = useCallback(
    (field) => (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    },
    []
  )

  const resetForm = useCallback(() => {
    setForm(defaultForm)
    setEditingId(null)
  }, [])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      setError('')

      const user = auth.currentUser
      if (!user) {
        setError('You must be signed in to create a sale.')
        return
      }

      if (!form.customerName.trim()) {
        setError('Customer name is required.')
        return
      }

      if (!kgValue || !rateValue) {
        setError('KG and Rate must be greater than zero.')
        return
      }

      setStatus('saving')

      const createdAt = form.saleDate
        ? Timestamp.fromDate(new Date(`${form.saleDate}T00:00:00`))
        : null

      try {
        const payload = {
          customerName: form.customerName.trim(),
          kg: kgValue,
          rate: rateValue,
          amount: amountValue,
          buyingPrice: buyAmountValue,
          createdBy: user.uid,
          createdAt,
        }

        if (editingId) {
          await updateSale(editingId, payload)
        } else {
          await createSale(payload)
        }

        resetForm()
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 1200)
      } catch (err) {
        setError(err.message)
        setStatus('idle')
      }
    },
    [amountValue, buyAmountValue, editingId, form.customerName, form.saleDate, kgValue, rateValue, resetForm]
  )

  const handleEdit = useCallback((sale) => {
    setEditingId(sale.id)
    setForm({
      customerName: sale.customerName ?? '',
      kg: sale.kg ?? '',
      rate: sale.rate ?? '',
      buyingPrice: sale.buyingPrice && sale.kg ? (sale.buyingPrice / sale.kg).toString() : '',
      saleDate: toInputDate(sale.createdAt),
    })
  }, [])

  const handleSignOut = async () => {
    await signOutUser()
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Agent Portal</p>
            <h1 className="text-2xl font-semibold text-slate-800">Sales Entry</h1>
            <p className="mt-1 text-xs text-slate-400">Signed in as Agent</p>
          </div>
          <div className="flex items-center gap-6 text-right text-xs text-slate-400">
            <div>
              <p>Payment Method: DTB</p>
              <p>Status: Pending by default</p>
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

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-5">
              <label className="text-sm font-medium text-slate-600">
                Customer Name
                <input
                  type="text"
                  value={form.customerName}
                  onChange={updateField('customerName')}
                  placeholder="e.g. Amina Ali"
                  className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                KG
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.kg}
                  onChange={updateField('kg')}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Rate
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rate}
                  onChange={updateField('rate')}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Buying Rate (/KG)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.buyingPrice}
                  onChange={updateField('buyingPrice')}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Total Buy
                <input
                  type="text"
                  value={formatNumber(buyAmountValue)}
                  readOnly
                  className="mt-2 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                />
              </label>
              <label className="text-sm font-medium text-slate-600">
                Sale Date
                <input
                  type="date"
                  value={form.saleDate}
                  onChange={updateField('saleDate')}
                  className="mt-2 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <label className="text-sm font-medium text-slate-600">
                Amount
                <input
                  type="text"
                  value={formatNumber(amountValue)}
                  readOnly
                  className="mt-2 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                />
              </label>
              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  disabled={status === 'saving'}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {status === 'saving'
                    ? 'Saving...'
                    : editingId
                      ? 'Update Sale'
                      : 'Save Sale'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  Clear
                </button>
              </div>
              <div className="text-xs text-slate-400 flex items-end">
                {status === 'saved'
                  ? 'Saved!'
                  : editingId
                    ? 'Editing existing sale.'
                    : 'Auto-calculates amount.'}
              </div>
            </div>

            {error ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Your Sales
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="border-b border-slate-200 px-4 py-3">Customer</th>
                  <th className="border-b border-slate-200 px-4 py-3">KG</th>
                  <th className="border-b border-slate-200 px-4 py-3">Rate</th>
                  <th className="border-b border-slate-200 px-4 py-3">Buy Total</th>
                  <th className="border-b border-slate-200 px-4 py-3">Amount</th>
                  <th className="border-b border-slate-200 px-4 py-3">Payment</th>
                  <th className="border-b border-slate-200 px-4 py-3">Status</th>
                  <th className="border-b border-slate-200 px-4 py-3">Created</th>
                  <th className="border-b border-slate-200 px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <TableEmptyState colSpan={9} message="No sales yet. Add your first entry above." />
                ) : (
                  sales.map((sale) => <SaleRow key={sale.id} sale={sale} onEdit={handleEdit} />)
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
