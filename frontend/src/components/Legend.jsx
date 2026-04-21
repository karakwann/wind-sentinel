import { convertSpeedValue, unitSuffix, msToBeaufort } from '../utils/windUnits'

// Palettes définies en m/s (bornes internes)
const LEGEND_BANDS = [
  { label: 'Calme',           color: '#E8F4F8', minMs: 0,  maxMs: 1  },
  { label: 'Brise légère',    color: '#74C6E6', minMs: 1,  maxMs: 5  },
  { label: 'Brise modérée',   color: '#4BA3D4', minMs: 5,  maxMs: 11 },
  { label: 'Vent frais',      color: '#F5A623', minMs: 11, maxMs: 20 },
  { label: 'Coup de vent',    color: '#E85D26', minMs: 20, maxMs: 29 },
  { label: 'Tempête',         color: '#C0392B', minMs: 29, maxMs: 39 },
  { label: 'Tempête violente',color: '#7B1A1A', minMs: 39, maxMs: null },
]

function formatRange(minMs, maxMs, unit) {
  if (unit === 'beaufort') {
    const bfMin = msToBeaufort(minMs)
    const bfMax = maxMs != null ? msToBeaufort(maxMs - 0.01) : 12
    return bfMin === bfMax ? `Bft ${bfMin}` : `Bft ${bfMin}–${bfMax}`
  }
  const suffix = unitSuffix(unit)
  const min = convertSpeedValue(minMs, unit)
  if (maxMs == null) return `> ${min} ${suffix}`
  const max = convertSpeedValue(maxMs, unit)
  return `${min}–${max} ${suffix}`
}

export default function Legend({ unit = 'knots' }) {
  return (
    <div className="absolute bottom-8 left-4 z-[1000] bg-gray-900/90 backdrop-blur rounded-xl p-3 text-white text-xs shadow-lg">
      <div className="font-semibold mb-2 text-gray-300">Vitesse du vent</div>
      {LEGEND_BANDS.map(({ label, color, minMs, maxMs }) => (
        <div key={label} className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-gray-200">{label}</span>
          <span className="text-gray-500 ml-auto pl-3">{formatRange(minMs, maxMs, unit)}</span>
        </div>
      ))}
    </div>
  )
}
