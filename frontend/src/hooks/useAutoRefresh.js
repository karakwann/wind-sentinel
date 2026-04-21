import { useEffect } from 'react'

export function useAutoRefresh(callback, intervalMs = 300_000) {
  useEffect(() => {
    const id = setInterval(callback, intervalMs)
    return () => clearInterval(id)
  }, [callback, intervalMs])
}
