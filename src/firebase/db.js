import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

const usersCol = collection(db, 'users')
const salesCol = collection(db, 'sales')

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() })

export const upsertUser = async (uid, payload) => {
  const ref = doc(usersCol, uid)
  await setDoc(ref, payload, { merge: true })
  return ref
}

export const getUserById = async (uid) => {
  const ref = doc(usersCol, uid)
  const snap = await getDoc(ref)
  return snap.exists() ? mapDoc(snap) : null
}

export const getUserByEmail = async (email) => {
  const q = query(usersCol, where('email', '==', email), limit(1))
  const snap = await getDocs(q)
  return snap.empty ? null : mapDoc(snap.docs[0])
}

const resolveCreatedAt = (value) => {
  if (!value) return serverTimestamp()
  if (value instanceof Date) return Timestamp.fromDate(value)
  return value
}

export const createSale = async (payload) => {
  const data = {
    customerName: payload.customerName,
    kg: payload.kg,
    rate: payload.rate,
    amount: payload.amount,
    buyingPrice: payload.buyingPrice ?? 0,
    paymentMethod: payload.paymentMethod ?? 'DTB',
    paymentStatus: payload.paymentStatus ?? 'pending',
    createdBy: payload.createdBy,
    createdAt: resolveCreatedAt(payload.createdAt),
  }
  const docRef = await addDoc(salesCol, data)
  return docRef
}

export const updateSale = async (saleId, payload) => {
  const ref = doc(salesCol, saleId)
  const data = { ...payload }
  if (payload.createdAt instanceof Date) {
    data.createdAt = Timestamp.fromDate(payload.createdAt)
  }
  await updateDoc(ref, data)
  return ref
}

export const deleteSale = async (saleId) => {
  const ref = doc(salesCol, saleId)
  await deleteDoc(ref)
}

export const getSaleById = async (saleId) => {
  const ref = doc(salesCol, saleId)
  const snap = await getDoc(ref)
  return snap.exists() ? mapDoc(snap) : null
}

export const getSalesByUser = async (uid) => {
  const q = query(salesCol, where('createdBy', '==', uid), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(mapDoc)
}

export const getRecentSales = async (count = 20) => {
  const q = query(salesCol, orderBy('createdAt', 'desc'), limit(count))
  const snap = await getDocs(q)
  return snap.docs.map(mapDoc)
}
