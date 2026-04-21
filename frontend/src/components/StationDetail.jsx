import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import axios from 'axios'
import { convertSpeed, convertSpeedValue, unitSuffix, formatDirection, getWindColor } from '../utils/windUnits'
import { Wind, Thermometer, X } from 'lucide-react'

function WindArrow({ direction, speedMs, size = 12 }) {
  const color = getWindColor(speedMs ?? 0)
  const rot = direction ?? 0
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{ display: 'block' }}>
      <g transform={`rotate(${rot}, 6, 6)`}>
        {/* Corps de la flèche */}
        <line x1="6" y1="10" x2="6" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        {/* Tête de flèche */}
        <polygon points="6,1 8.5,5 6,4 3.5,5" fill={color} />
      </g>
    </svg>
  )
}

export default function StationDetail({ station, unit, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!station) return
    setLoading(true)
    axios.get(`/api/history?station_id=${station.id}&lat=${station.lat}&lon=${station.lon}`)
      .then(res => setHistory(res.data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [station?.id])

  if (!station) return null

  const suffix = unitSuffix(unit)

  const chartData = history.map(h => ({
    time: h.time ? new Date(h.time).getHours() + 'h' : '',
    vitesse: h.wind_speed_ms != null ? convertSpeedValue(h.wind_speed_ms, unit) : null,
    rafale: h.wind_gust_ms != null ? convertSpeedValue(h.wind_gust_ms, unit) : null,
    direction: h.wind_direction,
    speedMs: h.wind_speed_ms,
  }))

  // Afficher une étiquette toutes les 6h, alignée sur les heures rondes
  const showLabel = (item) => {
    const h = item.time ? parseInt(item.time) : -1
    return h % 6 === 0
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
          <div className="text-xl font-bold" style={{ color: station.wind_speed_ms > 11 ? '#F5A623' : '#74C6E6' }}>
            {convertSpeed(station.wind_speed_ms, unit)}
          </div>
          <div className="text-gray-400 text-xs">
            {formatDirection(station.wind_direction)} ({station.wind_direction != null ? Math.round(station.wind_direction) + '°' : '—'})
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Rafale max</div>
          <div className="text-xl font-bold text-orange-400">
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
                <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#6b7280' }} interval={5} />
                <YAxis tick={{ fontSize: 8, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#9ca3af' }}
                  formatter={(value, name) => value != null ? [`${value} ${suffix}`, name] : ['-', name]}
                />
                <Line type="monotone" dataKey="vitesse" stroke="#74C6E6" strokeWidth={2} dot={false} name="Vent" connectNulls />
                <Line type="monotone" dataKey="rafale" stroke="#F5A623" strokeWidth={1.5} dot={false} name="Rafale" strokeDasharray="3 3" connectNulls />
              </LineChart>
            </ResponsiveContainer>

            {/* Flèches de direction */}
            <div className="mt-2">
              <p className="text-gray-500 text-xs mb-1">Direction</p>
              <div className="flex justify-between items-end">
                {chartData.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <WindArrow direction={d.direction} speedMs={d.speedMs} size={12} />
                    {showLabel(d) ? (
                      <span style={{ fontSize: 7, color: '#6b7280', lineHeight: 1 }}>{d.time}</span>
                    ) : (
                      <span style={{ fontSize: 7, lineHeight: 1 }}>&nbsp;</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
