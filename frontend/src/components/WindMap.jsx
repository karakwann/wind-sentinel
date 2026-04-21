import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getWindColor, convertSpeed, formatDirection, msToBeaufort } from '../utils/windUnits'

// leaflet-velocity est chargé via CDN dans index.html pour éviter les problèmes d'ESM
// On l'importe dynamiquement après montage

const FRANCE_CENTER = [46.5, 2.5]
const FRANCE_ZOOM = 6

function makeArrowIcon(direction, color, size = 28) {
  const rot = direction != null ? direction : 0
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 28 28">
    <g transform="rotate(${rot}, 14, 14)">
      <polygon points="14,3 19,22 14,18 9,22" fill="${color}" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>
    </g>
  </svg>`
  return L.divIcon({
    html: svg,
    className: 'wind-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function WindMap({ stations, gridData, unit, showAnimation, onStationClick }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const velocityLayerRef = useRef(null)

  // Init carte
  useEffect(() => {
    if (mapInstanceRef.current) return
    const map = L.map(mapRef.current, {
      center: FRANCE_CENTER,
      zoom: FRANCE_ZOOM,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OSM contributors',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map
    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Marqueurs stations
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !stations.length) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    stations.forEach(station => {
      if (station.lat == null || station.lon == null) return
      const color = getWindColor(station.wind_speed_ms || 0)
      const icon = makeArrowIcon(station.wind_direction, color)

      const marker = L.marker([station.lat, station.lon], { icon })
        .on('click', () => onStationClick(station))

      // Tooltip compact
      marker.bindTooltip(
        `<div style="font-size:11px;line-height:1.4">
          <b>${station.name || station.id}</b><br/>
          ${convertSpeed(station.wind_speed_ms, unit)}&nbsp;${formatDirection(station.wind_direction)}
        </div>`,
        { permanent: false, direction: 'top', offset: [0, -14] }
      )

      marker.addTo(map)
      markersRef.current.push(marker)
    })
  }, [stations, unit])

  // Couche animation vent
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !gridData) return

    if (velocityLayerRef.current) {
      map.removeLayer(velocityLayerRef.current)
      velocityLayerRef.current = null
    }

    if (!showAnimation) return

    // leaflet-velocity est chargé via CDN dans index.html
    const LV = window.L?.velocityLayer
    if (!LV) return

    const layer = LV({
      displayValues: false,
      displayOptions: { velocityType: 'Wind', position: 'bottomleft', emptyString: 'Pas de données' },
      data: gridData,
      maxVelocity: 20,
      velocityScale: 0.005,
      colorScale: ['#E8F4F8', '#74C6E6', '#4BA3D4', '#F5A623', '#E85D26', '#C0392B', '#7B1A1A'],
    })

    layer.addTo(map)
    velocityLayerRef.current = layer
  }, [gridData, showAnimation])

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
  )
}
