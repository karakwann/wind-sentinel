import { Wind } from 'lucide-react'
import { convertSpeedValue, unitSuffix, msToBeaufort } from '../utils/windUnits'

// Bornes en m/s alignées sur WIND_COLOR_SCALE (8kt=4.12, 15kt=7.72, 25kt=12.86, 35kt=18.01, 45kt=23.15)
const LEGEND_BANDS = [
  { label: 'Calme',        color: '#93C5FD', minMs: 0,     maxMs: 4.12  },
  { label: 'Brise',        color: '#22C55E', minMs: 4.12,  maxMs: 7.72  },
  { label: 'Vent modéré',  color: '#EAB308', minMs: 7.72,  maxMs: 12.86 },
  { label: 'Vent fort',    color: '#F97316', minMs: 12.86, maxMs: 18.01 },
  { label: 'Coup de vent', color: '#C2410C', minMs: 18.01, maxMs: 23.15 },
  { label: 'Tempête',      color: '#7F1D1D', minMs: 23.15, maxMs: null  },
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
    <div className="absolute bottom-8 left-4 z-[1000] panel p-3 text-text-primary text-xs min-w-[170px]">

      {/* En-tête */}
      <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-border-subtle">
        <Wind size={11} className="text-text-muted" strokeWidth={2} />
        <span className="text-text-secondary font-medium tracking-wide uppercase text-[10px]">
          Vitesse du vent
        </span>
      </div>

      {/* Bandes */}
      <div className="space-y-1.5">
        {LEGEND_BANDS.map(({ label, color, minMs, maxMs }) => (
          <div key={label} className="flex items-center gap-2">
            {/* Swatch */}
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0 ring-1 ring-black/10"
              style={{ backgroundColor: color }}
            />
            {/* Label */}
            <span className="text-text-secondary flex-1">{label}</span>
            {/* Valeur */}
            <span className="font-data text-text-muted text-[10px] tabular-nums text-right">
              {formatRange(minMs, maxMs, unit)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
