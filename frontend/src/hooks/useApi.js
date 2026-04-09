import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export function useApi(url, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!url) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(url)
      setData(res.data)
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [url, ...deps])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
