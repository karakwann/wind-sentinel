import { useState } from 'react'
import WindMap from './components/WindMap'
import Controls from './components/Controls'
import Legend from './components/Legend'
import StationDetail from './components/StationDetail'
import { useWindData } from './hooks/useWindData'
import { useAutoRefresh } from './hooks/useAutoRefresh'

export default function App() {
  const { stations, gridData, lastUpdate, loading, error, refetch } = useWindData()
  const [unit, setUnit]                   = useState('knots')
  const [showAnimation, setShowAnimation] = useState(true)
  const [selectedStation, setSelectedStation] = useState(null)
  const [showRealOnly, setShowRealOnly]   = useState(false)

  useAutoRefresh(refetch, 300_000)

  const displayedStations = showRealOnly
    ? stations.filter(s => s.source === 'synop')
    : stations

  const currentStation = selectedStation
    ? (stations.find(s => s.id === selectedStation.id) ?? selectedStation)
    : null

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#EDF4FF' }}>

      {/* Erreur réseau */}
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[2000]
                        bg-red-950/95 border border-red-800/60 text-red-300
                        text-sm px-4 py-2 rounded-lg backdrop-blur-md shadow-panel">
          Erreur : {error}
        </div>
      )}

      <WindMap
        stations={displayedStations}
        gridData={gridData}
        unit={unit}
        showAnimation={showAnimation}
        onStationClick={setSelectedStation}
      />

      <Controls
        unit={unit}
        onUnitChange={setUnit}
        showAnimation={showAnimation}
        onToggleAnimation={() => setShowAnimation(v => !v)}
        showRealOnly={showRealOnly}
        onToggleRealOnly={() => setShowRealOnly(v => !v)}
        lastUpdate={lastUpdate}
        onRefresh={refetch}
        loading={loading}
      />

      <Legend unit={unit} />

      {currentStation && (
        <StationDetail
          station={currentStation}
          unit={unit}
          onClose={() => setSelectedStation(null)}
          lastUpdate={lastUpdate}
        />
      )}

      {/* Footer */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000]
                      font-data text-text-muted text-[10px] tracking-wide tabular-nums
                      select-none pointer-events-none">
        Wind Sentinel · Météo-France SYNOP + Open-Meteo AROME
      </div>
    </div>
  )
}
