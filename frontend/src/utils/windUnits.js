const BEAUFORT_SCALE = [
  [0.3, 0], [1.5, 1], [3.3, 2], [5.5, 3],
  [8.0, 4], [10.8, 5], [13.9, 6], [17.2, 7],
  [20.7, 8], [24.5, 9], [28.4, 10], [32.6, 11],
  [Infinity, 12],
]

const WIND_COLOR_SCALE = [
  [0, 1, '#E8F4F8'],
  [1, 5, '#74C6E6'],
  [5, 11, '#4BA3D4'],
  [11, 20, '#F5A623'],
  [20, 29, '#E85D26'],
  [29, 39, '#C0392B'],
  [39, Infinity, '#7B1A1A'],
]

export function msToKnots(ms) { return ms * 1.94384 }
export function msToKmh(ms) { return ms * 3.6 }
export function msToMph(ms) { return ms * 2.23694 }

export function msToBeaufort(ms) {
  for (const [limit, bf] of BEAUFORT_SCALE) {
    if (ms < limit) return bf
  }
  return 12
}

export function getWindColor(speedMs) {
  for (const [min, max, color] of WIND_COLOR_SCALE) {
    if (speedMs >= min && speedMs < max) return color
  }
  return '#7B1A1A'
}

export function convertSpeed(speedMs, unit) {
  if (speedMs == null) return '—'
  switch (unit) {
    case 'knots':    return `${msToKnots(speedMs).toFixed(1)} kt`
    case 'kmh':      return `${msToKmh(speedMs).toFixed(1)} km/h`
    case 'mph':      return `${msToMph(speedMs).toFixed(1)} mph`
    case 'beaufort': return `Bft ${msToBeaufort(speedMs)}`
    default:         return `${speedMs.toFixed(1)} m/s`
  }
}

export function convertSpeedValue(speedMs, unit) {
  if (speedMs == null) return null
  switch (unit) {
    case 'knots':    return +msToKnots(speedMs).toFixed(1)
    case 'kmh':      return +msToKmh(speedMs).toFixed(1)
    case 'mph':      return +msToMph(speedMs).toFixed(1)
    case 'beaufort': return msToBeaufort(speedMs)
    default:         return +speedMs.toFixed(1)
  }
}

export function unitSuffix(unit) {
  switch (unit) {
    case 'knots':    return 'kt'
    case 'kmh':      return 'km/h'
    case 'mph':      return 'mph'
    case 'beaufort': return 'Bft'
    default:         return 'm/s'
  }
}

export function formatDirection(deg) {
  if (deg == null) return '—'
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO']
  return dirs[Math.round(deg / 22.5) % 16]
}
