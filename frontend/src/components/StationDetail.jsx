import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import axios from 'axios'
import { convertSpeed, convertSpeedValue, unitSuffix, formatDirection, getWindColor } from '../utils/windUnits'
import { Wind, Thermometer, X, Navigation } from 'lucide-react'

export default function StationDetail({ station, unit, onClose, lastUpdate }) {
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)

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

  const suffix  = unitSuffix(unit)
  const todayStr = new Date().toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })

  const chartData = history.map(h => {
    const dt      = h.time ? new Date(h.time) : null
    const dayStr  = dt ? dt.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) : null
    const isToday = dayStr === todayStr
    const hhmm    = dt
      ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
      : ''
    return {
      label:     dt ? (isToday ? hhmm : `hier ${hhmm}`) : '',
      isToday,
      vitesse:   h.wind_speed_ms != null ? convertSpeedValue(h.wind_speed_ms, unit) : null,
      rafale:    h.wind_gust_ms  != null ? convertSpeedValue(h.wind_gust_ms,  unit) : null,
      direction: h.wind_direction,
      speedMs:   h.wind_speed_ms,
      gustMs:    h.wind_gust_ms,
    }
  })

  /* ── Tooltip ─────────────────────────────────────── */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-white border border-border rounded-lg px-3 py-2 text-xs shadow-panel">
        <p className="text-text-muted mb-1.5 font-medium">{label}</p>
        {payload.map((p, i) => {
          const ms = p.name === 'Vent' ? p.payload.speedMs : p.payload.gustMs
          return p.value != null ? (
            <p key={i} className="text-text-secondary my-0.5">
              {p.name} :{' '}
              <span className="font-data font-medium" style={{ color: getWindColor(ms ?? 0) }}>
                {p.value} {suffix}
              </span>
            </p>
          ) : null
        })}
      </div>
    )
  }

  /* ── Tick axe X avec flèche de direction ────────── */
  const CustomXTick = ({ x, y, payload, index }) => {
    const d     = chartData[index]
    if (!d) return null
    const color = getWindColor(d.speedMs ?? 0)
    const rot   = d.direction != null ? (d.direction + 180) % 360 : 0
    return (
      <g>
        <g transform={`translate(${x - 6},${y + 2})`}>
          <g transform={`rotate(${rot}, 6, 6)`}>
            <line x1="6" y1="10" x2="6" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="6,1 8.5,5 6,4 3.5,5" fill={color} />
          </g>
        </g>
        <text x={x} y={y + 22} textAnchor="middle" fill="#64748B" fontSize={7}
              fontFamily="'Fira Code', monospace">
          {payload.value}
        </text>
      </g>
    )
  }

  const windColor = getWindColor(station.wind_speed_ms ?? 0)

  return (
    <div className="absolute bottom-8 right-4 z-[1000] w-80 panel-elevated p-4 text-text-primary shadow-xl">

      {/* ── En-tête ──────────────────────────────── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm text-text-primary leading-tight">
            {station.name || station.id}
          </h3>
          <p className="font-data text-text-muted text-[10px] mt-0.5 tabular-nums">
            {station.lat.toFixed(2)}°N · {station.lon.toFixed(2)}°E
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="text-text-muted hover:text-text-primary transition-colors duration-150
                     cursor-pointer p-1 rounded-lg hover:bg-black/[0.06] ml-2 -mt-0.5"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      {/* ── Mesures actuelles ────────────────────── */}
      <div className="grid grid-cols-2 gap-2 mb-4">

        {/* Vent moyen */}
        <div className="bg-bg-muted rounded-lg p-3 border border-border-subtle">
          <div className="flex items-center gap-1 text-text-muted text-[10px] mb-2 uppercase tracking-wide">
            <Wind size={10} strokeWidth={2} /> Vent moy.
          </div>
          <div className="font-data text-2xl font-semibold leading-none" style={{ color: windColor }}>
            {convertSpeed(station.wind_speed_ms, unit)}
          </div>
          <div className="flex items-center gap-1 text-text-muted text-[10px] mt-1.5">
            <Navigation size={9} strokeWidth={2}
              style={{ transform: `rotate(${(station.wind_direction ?? 0) + 180}deg)`, color: windColor }} />
            {formatDirection(station.wind_direction)}
            {station.wind_direction != null && (
              <span className="font-data">{Math.round(station.wind_direction)}°</span>
            )}
          </div>
        </div>

        {/* Rafale */}
        <div className="bg-bg-muted rounded-lg p-3 border border-border-subtle">
          <div className="text-text-muted text-[10px] mb-2 uppercase tracking-wide">
            Rafale max
          </div>
          <div className="font-data text-2xl font-semibold leading-none"
               style={{ color: getWindColor(station.wind_gust_ms ?? 0) }}>
            {station.wind_gust_ms != null ? convertSpeed(station.wind_gust_ms, unit) : '—'}
          </div>
          {station.temperature_c != null && (
            <div className="flex items-center gap-1 text-text-muted text-[10px] mt-1.5">
              <Thermometer size={9} strokeWidth={2} />
              <span className="font-data">{station.temperature_c}°C</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Historique 24h ───────────────────────── */}
      <div className="mb-3">
        <p className="text-text-muted text-[10px] uppercase tracking-wide mb-2">
          Historique 24h <span className="font-data normal-case">({suffix})</span>
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 border-2 border-slate-200 border-t-[#0284C7] rounded-full animate-spin" />
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={88}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id="gradVitesse" x1="0" y1="0" x2="1" y2="0">
                  {chartData.map((d, i) => (
                    <stop key={i}
                      offset={`${(i / Math.max(chartData.length - 1, 1)) * 100}%`}
                      stopColor={getWindColor(d.speedMs ?? 0)} />
                  ))}
                </linearGradient>
                <linearGradient id="gradRafale" x1="0" y1="0" x2="1" y2="0">
                  {chartData.map((d, i) => (
                    <stop key={i}
                      offset={`${(i / Math.max(chartData.length - 1, 1)) * 100}%`}
                      stopColor={getWindColor(d.gustMs ?? 0)} />
                  ))}
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={<CustomXTick />} interval={2} height={30} />
              <YAxis tick={{ fontSize: 8, fill: '#64748B', fontFamily: "'Fira Code', monospace" }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="vitesse" stroke="url(#gradVitesse)"
                    strokeWidth={2} dot={false} name="Vent" connectNulls />
              <Line type="monotone" dataKey="rafale" stroke="url(#gradRafale)"
                    strokeWidth={1.5} dot={false} name="Rafale"
                    strokeDasharray="3 3" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-text-muted text-xs text-center py-6">
            Historique indisponible
          </div>
        )}
      </div>

      {/* ── Fraîcheur des données ────────────────── */}
      <div className="flex items-start gap-2 text-[10px] bg-bg-muted rounded-lg px-3 py-2 border border-border-subtle">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {station.is_fresh
              ? <span className="live-dot" />
              : <span className="stale-dot" />
            }
            <span className={station.is_fresh ? 'text-emerald-400' : 'text-amber-400'}>
              {station.is_fresh ? 'Observation récente' : 'Observation ancienne'}
            </span>
            {station.observation_time && (
              <span className="font-data text-text-muted tabular-nums">
                {new Date(station.observation_time).toLocaleTimeString('fr-FR', {
                  hour: '2-digit', minute: '2-digit',
                })}
                {' '}({Math.round((Date.now() - new Date(station.observation_time)) / 60000)} min)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {station.source === 'metar'
              ? <span className="text-emerald-600 font-medium">↗ Observation METAR</span>
              : <span className="text-slate-400">⬡ Modèle AROME</span>
            }
          </div>

          {lastUpdate && (
            <div className="flex items-center gap-1.5 text-accent-blue">
              <span>↻</span>
              <span>
                Actualisé à{' '}
                <span className="font-data tabular-nums">
                  {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {' '}({Math.round((Date.now() - lastUpdate) / 60000)} min)
              </span>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
