import { RefreshCw } from 'lucide-react'

const UNITS = [
  { value: 'ms', label: 'm/s' },
  { value: 'knots', label: 'nœuds' },
  { value: 'kmh', label: 'km/h' },
  { value: 'beaufort', label: 'Beaufort' },
]

export default function Controls({ unit, onUnitChange, showAnimation, onToggleAnimation, lastUpdate, onRefresh, loading }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 bg-gray-900/90 backdrop-blur rounded-xl px-4 py-2 shadow-lg text-white">
      <span className="text-gray-400 text-sm mr-1">Unité :</span>
      {UNITS.map(u => (
        <button
          key={u.value}
          onClick={() => onUnitChange(u.value)}
          className={`text-sm px-3 py-1 rounded-lg transition-colors ${
            unit === u.value ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          {u.label}
        </button>
      ))}

      <div className="w-px h-5 bg-gray-600 mx-2" />

      <button
        onClick={onToggleAnimation}
        className={`text-sm px-3 py-1 rounded-lg transition-colors ${
          showAnimation ? 'bg-emerald-700 text-white' : 'text-gray-300 hover:bg-gray-700'
        }`}
      >
        Animation
      </button>

      <div className="w-px h-5 bg-gray-600 mx-2" />

      <button
        onClick={onRefresh}
        disabled={loading}
        className="text-gray-300 hover:text-white transition-colors"
        title="Rafraîchir"
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
      </button>

      {lastUpdate && (
        <span className="text-gray-500 text-xs ml-1">
          {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
}
