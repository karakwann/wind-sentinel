import { useEffect, useRef } from 'react'

export function useAutoRefresh(callback, intervalMs = 300_000) {
  const lastRefresh = useRef(Date.now())

  useEffect(() => {
    const tick = () => {
      callback()
      lastRefresh.current = Date.now()
    }

    const id = setInterval(tick, intervalMs)

    // Rafraîchit immédiatement si l'onglet revient au premier plan après > intervalMs
    const onVisible = () => {
      if (!document.hidden && Date.now() - lastRefresh.current >= intervalMs) {
        tick()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [callback, intervalMs])
}
