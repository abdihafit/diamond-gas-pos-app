import { useEffect, useState } from 'react'
import { onAuthChanged } from '../firebase/auth'
import { getUserById } from '../firebase/db'

export const useAuthRole = () => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      setUser(firebaseUser)
      setRole(null)
      setError('')

      if (!firebaseUser) {
        setLoading(false)
        return
      }

      try {
        const profile = await getUserById(firebaseUser.uid)
        setRole(profile?.role ?? null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  return { user, role, loading, error }
}
