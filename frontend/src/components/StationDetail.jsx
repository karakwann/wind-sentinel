import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import axios from 'axios'
import { convertSpeed, convertSpeedValue, unitSuffix, formatDirection, getWindColor } from '../utils/windUnits'
import { Wind, Thermometer, X } from 'lucide-react'


export default function StationDetail({ station, unit, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = (id, lat, lon) =>
    axios.get(`/api/history?station_id=${id}&lat=${lat}&lon=${lon}`)
      .then(res => setHistory(res.data.history || []))
      .catch(() => setHistory([]))

  useEffect(() => {
    if (!station) return
    setLoading(true)
    fetchHistory(station.id, station.lat, station.lon).finally(() => setLoading(false))
  }, [station?.id])

  useEffect(() => {
    if (!station) return
    const id = setInterval(
      () => fetchHistory(station.id, station.lat, station.lon),
      300_000
    )
    return () => clearInterval(id)
  }, [station?.id])

  if (!station) return null

  const suffix = unitSuffix(unit)

  const todayStr = new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })
  const chartData = history.map(h => {
    const dt = h.time ? new Date(h.time) : null
    const dayStr = dt ? dt.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) : null
    const isToday = dayStr === todayStr
    const hhmm = dt ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }) : ''
    return {
      label: dt ? (isToday ? hhmm : `hier ${hhmm}`) : '',
      isToday,
      vitesse: h.wind_speed_ms != null ? convertSpeedValue(h.wind_speed_ms, unit) : null,
      rafale: h.wind_gust_ms != null ? convertSpeedValue(h.wind_gust_ms, unit) : null,
      direction: h.wind_direction,
      speedMs: h.wind_speed_ms,
      gustMs: h.wind_gust_ms,
    }
  })

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: '#1f2937', borderRadius: 8, fontSize: 11, padding: '6px 10px' }}>
        <p style={{ color: '#9ca3af', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => {
          const ms = p.name === 'Vent' ? p.payload.speedMs : p.payload.gustMs
          return p.value != null ? (
            <p key={i} style={{ color: '#ffffff', margin: '2px 0' }}>
              {p.name} : <span style={{ color: getWindColor(ms ?? 0) }}>{p.value} {suffix}</span>
            </p>
          ) : null
        })}
      </div>
    )
  }

  const CustomXTick = ({ x, y, payload, index }) => {
    const d = chartData[index]
    if (!d) return null
    const color = getWindColor(d.speedMs ?? 0)
    const rot = d.direction != null ? (d.direction + 180) % 360 : 0
    return (
      <g>
        <g transform={`translate(${x - 6},${y + 2})`}>
          <g transform={`rotate(${rot}, 6, 6)`}>
            <line x1="6" y1="10" x2="6" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="6,1 8.5,5 6,4 3.5,5" fill={color} />
          </g>
        </g>
        <text x={x} y={y + 22} textAnchor="middle" fill="#6b7280" fontSize={7}>{payload.value}</text>
      </g>
    )
  }

  return (
    <div className="absolute bottom-8 right-4 z-[1000] w-80 bg-gray-900/95 backdrop-blur rounded-xl p-4 text-white shadow-xl">

      {/* En-tête */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-base">{station.name || station.id}</h3>
          <p className="text-gray-400 text-xs">{station.lat.toFixed(2)}°N, {station.lon.toFixed(2)}°E</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white ml-2">
          <X size={16} />
        </button>
      </div>

      {/* Mesures actuelles */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
            <Wind size={12} /> Vent moyen
          </div>
          <div className="text-xl font-bold" style={{ color: getWindColor(station.wind_speed_ms ?? 0) }}>
            {convertSpeed(station.wind_speed_ms, unit)}
          </div>
          <div className="text-gray-400 text-xs">
            {formatDirection(station.wind_direction)} ({station.wind_direction != null ? Math.round(station.wind_direction) + '°' : '—'})
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Rafale max</div>
          <div className="text-xl font-bold" style={{ color: getWindColor(station.wind_gust_ms ?? 0) }}>
            {station.wind_gust_ms != null ? convertSpeed(station.wind_gust_ms, unit) : '—'}
          </div>
          {station.temperature_c != null && (
            <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
              <Thermometer size={12} /> {station.temperature_c}°C
            </div>
          )}
        </div>
      </div>

      {/* Historique */}
      <div>
        <p className="text-gray-400 text-xs mb-1">Historique 24h ({suffix})</p>

        {loading ? (
          <div className="text-gray-500 text-xs text-center py-6">Chargement...</div>
        ) : chartData.length > 0 ? (
          <>
            {/* Graphique vitesse */}
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="gradVitesse" x1="0" y1="0" x2="1" y2="0">
                    {chartData.map((d, i) => (
                      <stop key={i} offset={`${(i / Math.max(chartData.length - 1, 1)) * 100}%`} stopColor={getWindColor(d.speedMs ?? 0)} />
                    ))}
                  </linearGradient>
                  <linearGradient id="gradRafale" x1="0" y1="0" x2="1" y2="0">
                    {chartData.map((d, i) => (
                      <stop key={i} offset={`${(i / Math.max(chartData.length - 1, 1)) * 100}%`} stopColor={getWindColor(d.gustMs ?? 0)} />
                    ))}
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={<CustomXTick />} interval={2} height={30} />
                <YAxis tick={{ fontSize: 8, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="vitesse" stroke="url(#gradVitesse)" strokeWidth={2} dot={false} name="Vent" connectNulls />
                <Line type="monotone" dataKey="rafale" stroke="url(#gradRafale)" strokeWidth={1.5} dot={false} name="Rafale" strokeDasharray="3 3" connectNulls />
              </LineChart>
            </ResponsiveContainer>

          </>
        ) : (
          <div className="text-gray-500 text-xs text-center py-4">Historique indisponible</div>
        )}
      </div>

      {/* Fraîcheur */}
      <div className={`mt-3 text-xs px-2 py-1 rounded text-center ${station.is_fresh ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'}`}>
        {station.is_fresh ? '● Données fraîches' : '⚠ Données anciennes'}
        {station.observation_time && (
          <span className="ml-1 opacity-75">
            — {new Date(station.observation_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} (
            {Math.round((Date.now() - new Date(station.observation_time)) / 60000)} min)
          </span>
        )}
      </div>
    </div>
  )
}
