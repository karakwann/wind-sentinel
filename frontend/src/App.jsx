import { useState } from 'react'
import WindMap from './components/WindMap'
import Controls from './components/Controls'
import Legend from './components/Legend'
import StationDetail from './components/StationDetail'
import { useWindData } from './hooks/useWindData'
import { useAutoRefresh } from './hooks/useAutoRefresh'

export default function App() {
  const { stations, gridData, lastUpdate, loading, error, refetch } = useWindData()
  const [unit, setUnit] = useState('knots')
  const [showAnimation, setShowAnimation] = useState(true)
  const [selectedStation, setSelectedStation] = useState(null)

  useAutoRefresh(refetch, 300_000)

  const currentStation = selectedStation
    ? (stations.find(s => s.id === selectedStation.id) ?? selectedStation)
    : null

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#1a1a2e' }}>
      {error && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[2000] bg-red-900/90 text-red-200 text-sm px-4 py-2 rounded-lg">
          Erreur : {error}
        </div>
      )}

      <WindMap
        stations={stations}
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
        />
      )}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] text-gray-600 text-xs">
        Wind Sentinel · Données Météo-France SYNOP + Open-Meteo AROME
      </div>
    </div>
  )
}
