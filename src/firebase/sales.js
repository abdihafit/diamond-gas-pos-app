import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './config'

const salesCollection = collection(db, 'sales')

function normalizeSaleInput(data) {
  const kg = Number(data.kg ?? 0)
  const rate = Number(data.rate ?? 0)
  const amount = Number(data.amount ?? kg * rate)

  return {
    customerName: data.customerName,
    kg,
    rate,
    amount,
    paymentMethod: data.paymentMethod || 'DTB',
    paymentStatus: data.paymentStatus || 'pending',
    createdBy: data.createdBy ?? null,
  }
}

export async function createSale(data) {
  const payload = {
    ...normalizeSaleInput(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(salesCollection, payload)
  return getSale(docRef.id)
}

export async function getSale(saleId) {
  const snapshot = await getDoc(doc(salesCollection, saleId))

  if (!snapshot.exists()) {
    return null
  }

  return { id: snapshot.id, ...snapshot.data() }
}

export async function listSales(maxResults = 25) {
  const salesQuery = query(
    salesCollection,
    orderBy('createdAt', 'desc'),
    limit(maxResults),
  )
  const snapshot = await getDocs(salesQuery)

  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export async function updateSale(saleId, data) {
  await updateDoc(doc(salesCollection, saleId), {
    ...normalizeSaleInput(data),
    updatedAt: serverTimestamp(),
  })

  return getSale(saleId)
}

export function deleteSale(saleId) {
  return deleteDoc(doc(salesCollection, saleId))
}
