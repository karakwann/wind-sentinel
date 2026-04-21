import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

export function useWindData() {
  const [stations, setStations] = useState([])
  const [gridData, setGridData] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const [stationsRes, gridRes] = await Promise.all([
        axios.get('/api/stations'),
        axios.get('/api/grid'),
      ])
      setStations(stationsRes.data.stations || [])
      setGridData(gridRes.data)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { stations, gridData, lastUpdate, loading, error, refetch: fetchData }
}
