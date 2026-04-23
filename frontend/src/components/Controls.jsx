import { RefreshCw } from 'lucide-react'

const UNITS = [
  { value: 'ms',       label: 'm/s'      },
  { value: 'knots',    label: 'nœuds'    },
  { value: 'kmh',      label: 'km/h'     },
  { value: 'beaufort', label: 'Beaufort' },
]

export default function Controls({
  unit, onUnitChange,
  showAnimation, onToggleAnimation,
  showRealOnly, onToggleRealOnly,
  lastUpdate, onRefresh, loading,
}) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]
                    flex items-center gap-1.5
                    panel px-3 py-2 text-text-primary">

      {/* Unités */}
      <span className="text-text-muted text-xs font-medium mr-1 tracking-wide uppercase">
        Unité
      </span>

      {UNITS.map(u => (
        <button
          key={u.value}
          onClick={() => onUnitChange(u.value)}
          title={u.label}
          className={unit === u.value ? 'btn-pill-active' : 'btn-pill-inactive'}
        >
          {u.label}
        </button>
      ))}

      {/* Séparateur */}
      <div className="w-px h-5 bg-border mx-1" />

      {/* Animation toggle */}
      <button
        onClick={onToggleAnimation}
        className={showAnimation
          ? 'btn-pill bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
          : 'btn-pill-inactive border border-transparent'
        }
      >
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${showAnimation ? 'bg-emerald-500' : 'bg-text-muted'}`} />
          Animation
        </span>
      </button>

      {/* Séparateur */}
      <div className="w-px h-5 bg-border mx-1" />

      {/* Filtre stations réelles */}
      <button
        onClick={onToggleRealOnly}
        className={showRealOnly
          ? 'btn-pill bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100'
          : 'btn-pill-inactive border border-transparent'
        }
      >
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${showRealOnly ? 'bg-sky-500' : 'bg-text-muted'}`} />
          Vrais relevés
        </span>
      </button>

      {/* Séparateur */}
      <div className="w-px h-5 bg-border mx-1" />

      {/* Refresh + heure */}
      <button
        onClick={onRefresh}
        disabled={loading}
        aria-label="Rafraîchir les données"
        className="text-text-secondary hover:text-text-primary transition-colors duration-150 cursor-pointer disabled:opacity-40 p-1 rounded-lg hover:bg-black/[0.06]"
      >
        <RefreshCw
          size={14}
          className={loading ? 'animate-spin' : ''}
          strokeWidth={2}
        />
      </button>

      {lastUpdate && (
        <span className="font-data text-text-muted text-xs tabular-nums">
          {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  )
}
