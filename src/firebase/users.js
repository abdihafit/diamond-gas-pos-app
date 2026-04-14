import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './config'

const usersCollection = collection(db, 'users')

export async function createUserProfile(userId, data) {
  const payload = {
    name: data.name,
    role: data.role,
    email: data.email ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(usersCollection, userId), payload)
  return getUserProfile(userId)
}

export async function upsertUserProfile(userId, data) {
  const payload = {
    name: data.name,
    role: data.role,
    email: data.email ?? null,
    updatedAt: serverTimestamp(),
  }

  await setDoc(doc(usersCollection, userId), payload, { merge: true })
  return getUserProfile(userId)
}

export async function getUserProfile(userId) {
  const snapshot = await getDoc(doc(usersCollection, userId))

  if (!snapshot.exists()) {
    return null
  }

  return { id: snapshot.id, ...snapshot.data() }
}

export async function listUsers() {
  const snapshot = await getDocs(usersCollection)
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export async function updateUserProfile(userId, data) {
  await updateDoc(doc(usersCollection, userId), {
    ...data,
    updatedAt: serverTimestamp(),
  })

  return getUserProfile(userId)
}

export function deleteUserProfile(userId) {
  return deleteDoc(doc(usersCollection, userId))
}
