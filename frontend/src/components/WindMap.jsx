import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getWindColor, convertSpeed, formatDirection, msToBeaufort } from '../utils/windUnits'

// leaflet-velocity est chargé via CDN dans index.html pour éviter les problèmes d'ESM
// On l'importe dynamiquement après montage

const FRANCE_CENTER = [46.5, 2.5]
const FRANCE_ZOOM = 6

// Polygone France métropolitaine + Corse [lat, lon] — extrait de Natural Earth, simplifié RDP 0.03°
// eslint-disable-next-line
const FRANCE_RINGS = [
  // Métropole (416 pts)
  [
    [51.0875,2.5218],[50.9611,2.6084],[50.8454,2.5867],[50.7234,2.7867],[50.6966,2.8869],[50.7578,2.9714],
    [50.7791,3.1292],[50.6959,3.2324],[50.5269,3.271],[50.4765,3.6083],[50.2982,3.6969],[50.3463,3.755],
    [50.3441,4.0033],[50.2571,4.1253],[50.2585,4.1976],[50.1282,4.1258],[50.1272,4.1806],[50.0602,4.21],
    [49.975,4.1317],[49.9323,4.4351],[49.9845,4.6458],[50.0839,4.6819],[50.1613,4.8156],[50.1398,4.8719],
    [49.9583,4.7839],[49.9133,4.8602],[49.7942,4.849],[49.7971,4.971],[49.6872,5.1694],[49.6913,5.2592],
    [49.6133,5.2979],[49.6025,5.4021],[49.4989,5.4561],[49.5494,5.7463],[49.4413,5.9607],[49.4994,6.1936],
    [49.4655,6.4027],[49.4247,6.5117],[49.1589,6.7138],[49.1478,6.8218],[49.2095,6.8335],[49.2067,6.9144],
    [49.1817,7.0095],[49.1076,7.0425],[49.142,7.0799],[49.105,7.2744],[49.1689,7.4105],[49.0378,7.635],
    [49.0348,7.9319],[48.9586,8.2003],[48.8075,8.0903],[48.615,7.8103],[48.3414,7.7507],[48.1297,7.5857],
    [47.9714,7.6211],[47.7073,7.5119],[47.5846,7.586],[47.4306,7.3785],[47.4168,7.2381],[47.4436,7.1683],
    [47.4883,7.1808],[47.4891,6.9733],[47.4522,6.991],[47.3542,6.8666],[47.3681,7.004],[47.3295,7.0366],
    [47.0213,6.6654],[46.9442,6.4426],[46.7608,6.4292],[46.5835,6.1184],[46.5516,6.1457],[46.4194,6.0542],
    [46.3704,6.1351],[46.253,6.094],[46.1999,5.9548],[46.1305,5.9588],[46.1502,6.1403],[46.2401,6.2812],
    [46.3155,6.2141],[46.375,6.2691],[46.4486,6.4829],[46.4142,6.7871],[46.3455,6.7504],[46.2695,6.8277],
    [46.1516,6.7657],[46.1123,6.8692],[46.0496,6.8509],[46.0486,6.9151],[45.9253,7.0221],[45.8578,6.949],
    [45.8265,6.8008],[45.7181,6.7959],[45.6407,6.9634],[45.5111,6.9828],[45.4109,7.1607],[45.2137,7.0555],
    [45.2098,6.9587],[45.1301,6.8441],[45.1573,6.7364],[45.1035,6.6027],[45.0134,6.7235],[44.9078,6.7454],
    [44.8221,7.0071],[44.6849,7.0552],[44.6832,6.9599],[44.534,6.8357],[44.4363,6.9178],[44.3721,6.8661],
    [44.2417,6.9828],[44.1253,7.331],[44.1761,7.6556],[44.0673,7.6899],[43.8655,7.4779],[43.7646,7.4764],
    [43.6548,7.1516],[43.554,7.1389],[43.5401,6.9621],[43.4276,6.894],[43.4078,6.7311],[43.3506,6.7178],
    [43.2689,6.5909],[43.273,6.6934],[43.2016,6.6798],[43.1469,6.4017],[43.0908,6.3754],[43.1088,6.1932],
    [43.072,6.1532],[43.0359,6.1801],[43.0348,6.0885],[43.0714,6.1291],[43.134,5.9409],[43.1204,5.8794],
    [43.08,5.9514],[43.0448,5.8566],[43.1799,5.6739],[43.2159,5.347],[43.2704,5.3692],[43.3555,5.2942],
    [43.3355,5.034],[43.4093,5.0261],[43.4283,5.1738],[43.4803,5.2263],[43.5586,5.0291],[43.4293,5.0511],
    [43.4215,4.8682],[43.367,4.901],[43.3418,4.8558],[43.4223,4.7578],[43.5791,4.6946],[43.4226,4.7425],
    [43.3464,4.8203],[43.3599,4.5923],[43.4301,4.5796],[43.4558,4.513],[43.4638,4.1817],[43.5519,4.1053],
    [43.5399,3.953],[43.2811,3.5134],[43.2631,3.3177],[43.1063,3.114],[42.9428,3.039],[42.6291,3.0418],
    [42.5549,3.0518],[42.5249,3.1374],[42.4315,3.181],[42.4702,2.9337],[42.4062,2.6904],[42.3728,2.6403],
    [42.339,2.6622],[42.3257,2.5148],[42.4286,2.2774],[42.3487,1.9957],[42.4369,1.9275],[42.4937,1.7122],
    [42.5634,1.7651],[42.6099,1.722],[42.6494,1.5431],[42.5954,1.4293],[42.7087,1.3426],[42.7067,1.1515],
    [42.7713,1.0891],[42.8316,0.8129],[42.8384,0.6563],[42.6845,0.6436],[42.7175,0.3542],[42.6687,0.2754],
    [42.7265,0.1692],[42.6851,-0.0389],[42.7169,-0.119],[42.7953,-0.1614],[42.8425,-0.3228],[42.7726,-0.569],
    [42.8848,-0.7403],[42.9465,-0.7597],[43.0057,-1.1499],[43.0552,-1.2937],[43.1092,-1.286],[43.0931,-1.3483],
    [43.0333,-1.3661],[43.0451,-1.4571],[43.0818,-1.4878],[43.1353,-1.4258],[43.2433,-1.4035],[43.2841,-1.559],
    [43.247,-1.6219],[43.2975,-1.6549],[43.291,-1.7474],[43.3744,-1.7964],[43.3997,-1.661],[43.5801,-1.4769],
    [44.3022,-1.2816],[44.5561,-1.2572],[44.6655,-1.1865],[44.6694,-1.0447],[44.7783,-1.1722],[44.6274,-1.2604],
    [45.4901,-1.14],[45.569,-1.0853],[45.3261,-0.7662],[45.1345,-0.716],[44.998,-0.569],[44.895,-0.5347],
    [44.9765,-0.539],[45.0246,-0.5962],[44.998,-0.4938],[45.0991,-0.656],[45.3611,-0.7197],[45.4771,-0.7955],
    [45.6604,-1.0838],[45.7099,-1.2473],[45.7924,-1.2303],[45.8067,-1.1638],[45.7174,-0.9872],[45.8681,-1.1517],
    [45.9044,-1.0734],[46.0184,-1.1107],[46.0388,-1.0487],[46.1745,-1.2108],[46.3027,-1.1107],[46.3262,-1.1772],
    [46.2842,-1.2401],[46.3542,-1.3702],[46.3434,-1.4487],[46.4082,-1.4814],[46.4311,-1.6256],[46.5329,-1.7892],
    [46.4945,-1.7954],[46.6918,-1.9099],[46.82,-2.1188],[46.8935,-2.1288],[47.0354,-1.9907],[47.0921,-2.03],
    [47.1425,-2.2411],[47.1679,-2.1652],[47.2712,-2.1606],[47.3001,-2.0146],[47.2108,-1.727],[47.3197,-2.0101],
    [47.3132,-2.1481],[47.2464,-2.2784],[47.3001,-2.542],[47.307,-2.4362],[47.3832,-2.5564],[47.4237,-2.3918],
    [47.4912,-2.4947],[47.5062,-2.3639],[47.5198,-2.632],[47.5539,-2.5768],[47.4992,-2.8171],[47.5584,-2.9093],
    [47.5513,-2.7414],[47.6044,-2.6886],[47.6427,-2.7065],[47.6023,-2.7086],[47.6427,-2.7891],[47.5955,-2.9194],
    [47.6638,-2.9747],[47.5608,-2.9399],[47.6072,-3.0118],[47.5988,-3.1233],[47.4782,-3.0845],[47.4782,-3.1317],
    [47.598,-3.1412],[47.6396,-3.2006],[47.7321,-3.118],[47.7464,-3.1932],[47.711,-3.1591],[47.6564,-3.2242],
    [47.6973,-3.3583],[47.6911,-3.2826],[47.711,-3.3583],[47.7873,-3.2826],[47.7046,-3.4464],[47.7799,-3.5283],
    [47.801,-3.8517],[47.9,-3.9618],[47.855,-4.0367],[47.9239,-4.1322],[47.8693,-4.1112],[47.8744,-4.1856],
    [47.842,-4.1527],[47.8134,-4.1852],[47.8072,-4.3718],[47.8629,-4.3473],[47.9757,-4.4346],[48.0406,-4.7281],
    [48.1154,-4.2854],[48.1964,-4.3024],[48.2324,-4.3793],[48.2426,-4.4855],[48.1772,-4.5575],[48.2526,-4.5472],
    [48.2871,-4.6263],[48.3468,-4.5467],[48.2958,-4.5155],[48.3075,-4.1875],[48.3217,-4.3247],[48.3627,-4.2694],
    [48.3354,-4.4537],[48.4316,-4.2899],[48.3454,-4.7684],[48.5202,-4.7646],[48.5682,-4.722],[48.5682,-4.5773],
    [48.603,-4.6077],[48.6017,-4.5301],[48.6296,-4.5636],[48.6789,-4.3433],[48.6501,-4.1938],[48.6911,-4.1739],
    [48.7328,-3.974],[48.6575,-3.9547],[48.678,-3.892],[48.6296,-3.8517],[48.7332,-3.8101],[48.6828,-3.5848],
    [48.7332,-3.5805],[48.7395,-3.5283],[48.7906,-3.5815],[48.8419,-3.5153],[48.8073,-3.3976],[48.8723,-3.2297],
    [48.7941,-3.2205],[48.8713,-3.0915],[48.76,-3.1255],[48.8214,-3.0082],[48.7879,-3.0424],[48.7674,-2.9331],
    [48.7332,-2.9467],[48.509,-2.6824],[48.6365,-2.4595],[48.6501,-2.4875],[48.6986,-2.3161],[48.6706,-2.282],
    [48.6296,-2.3303],[48.6501,-2.251],[48.5819,-2.2137],[48.6501,-2.0524],[48.5136,-1.9803],[48.534,-1.9394],
    [48.5887,-1.9803],[48.575,-1.953],[48.6433,-2.0287],[48.6986,-1.9456],[48.7121,-1.8437],[48.6409,-1.861],
    [48.6159,-1.796],[48.6433,-1.3566],[48.7471,-1.5536],[48.8494,-1.6029],[48.9352,-1.5428],[49.0303,-1.5458],
    [49.0337,-1.508],[49.029,-1.5936],[49.1435,-1.5695],[49.2159,-1.6104],[49.2255,-1.5484],[49.2193,-1.6247],
    [49.3559,-1.6991],[49.3837,-1.8165],[49.5309,-1.8847],[49.6198,-1.8395],[49.678,-1.9456],[49.7241,-1.9352],
    [49.6501,-1.6067],[49.7116,-1.4095],[49.6955,-1.2631],[49.6241,-1.2278],[49.5581,-1.3063],[49.4152,-1.1757],
    [49.3562,-1.182],[49.3454,-1.1229],[49.3968,-1.0723],[49.3923,-0.9404],[49.3428,-0.4111],[49.2801,-0.2195],
    [49.4521,0.4113],[49.4936,0.4932],[49.4641,0.2568],[49.535,0.0766],[49.7293,0.2359],[49.8572,0.5967],
    [49.979,1.2212],[50.1236,1.4558],[50.2147,1.521],[50.1925,1.6725],[50.2779,1.5415],[50.3491,1.5515],
    [50.3707,1.6104],[50.4048,1.5552],[50.5482,1.6104],[50.6783,1.5632],[50.79,1.6056],[50.8688,1.5806],
    [50.9968,1.9214],[51.0875,2.5218],
  ],
  // Corse (47 pts)
  [
    [42.2086,8.5658],[42.2423,8.5495],[42.2729,8.6878],[42.3771,8.5491],[42.4299,8.6595],[42.5792,8.7092],
    [42.562,8.787],[42.6064,8.8054],[42.6622,9.05],[42.732,9.1178],[42.6748,9.2922],[42.7491,9.3425],
    [42.8393,9.3057],[42.9286,9.3602],[43.0037,9.3467],[42.9901,9.464],[42.8023,9.4828],[42.6406,9.4429],
    [42.5635,9.5281],[42.1466,9.5596],[41.9529,9.4032],[41.7064,9.4016],[41.6196,9.3467],[41.6264,9.2922],
    [41.5984,9.2786],[41.5812,9.3506],[41.4482,9.2107],[41.4073,9.2107],[41.4278,9.2503],[41.3725,9.2232],
    [41.4035,9.0964],[41.4346,9.1213],[41.4824,9.0798],[41.4892,8.9357],[41.5612,8.7918],[41.6391,8.8018],
    [41.6946,8.9227],[41.7499,8.6551],[41.8244,8.7849],[41.8455,8.7508],[41.9069,8.8054],[41.9008,8.6143],
    [41.969,8.5863],[42.0566,8.745],[42.154,8.5596],[42.1671,8.5938],[42.2086,8.5658],
  ],
]

function makeArrowIcon(direction, color, size = 28, speedMs = 0, gustMs = null) {
  const rot = direction != null ? (direction + 180) % 360 : 0

  // Pulsation directionnelle (translation)
  const amp = speedMs < 4.12 ? 0 : Math.min(1 + speedMs * 0.28, 7)
  const dur = speedMs < 4.12 ? 999 : Math.max(0.25, 1.8 - speedMs * 0.06)
  const animateTranslate = amp > 0
    ? `<animateTransform attributeName="transform" type="translate" values="0,0; 0,${-amp}; 0,0" dur="${dur}s" repeatCount="indefinite"/>`
    : ''

  // Oscillation de couleur : vent moyen ↔ rafale
  const gustColor = gustMs != null ? getWindColor(gustMs) : null
  const colorDur = Math.max(1.2, 2.5 - speedMs * 0.04)
  const animateColor = gustColor && gustColor !== color
    ? `<animate attributeName="fill" values="${color};${gustColor};${color}" dur="${colorDur}s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>`
    : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 28 28">
    <g transform="rotate(${rot}, 14, 14)">
      <g>${animateTranslate}
        <polygon points="14,3 19,22 14,18 9,22" fill="${color}" stroke="rgba(0,0,0,0.22)" stroke-width="1">${animateColor}</polygon>
      </g>
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
    const FRANCE_BOUNDS = [[41.0, -5.5], [51.5, 10.0]]
    const map = L.map(mapRef.current, {
      zoomControl: true,
      maxBounds: FRANCE_BOUNDS,
      maxBoundsViscosity: 1.0,
    })

    map.fitBounds(FRANCE_BOUNDS, { animate: false })
    map.setMinZoom(map.getZoom())

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    // Contour France (trait uniquement, sans remplissage)
    FRANCE_RINGS.forEach(ring => {
      L.polyline(ring, {
        color: '#94A3B8',
        weight: 0.8,
        opacity: 0.5,
        interactive: false,
      }).addTo(map)
    })

    // CSS clip-path sur le tilePane uniquement — les marqueurs (markerPane) ne sont pas clippés.
    // On cible le tilePane plutôt que le map-div entier pour que les flèches de vent
    // restent visibles même hors des frontières (marqueurs dans markerPane, frère du tilePane).
    //
    // Coordonnées : latLngToLayerPoint() retourne les px dans le repère "layer" (= repère
    // du mapPane avant transform). Le tilePane étant un enfant direct du mapPane sans
    // transform propre, le clip se déplace automatiquement avec les tuiles lors du pan —
    // aucune mise à jour sur 'move' nécessaire. Seul le zoom change pixelOrigin → update.
    const clipId = `france-clip-${Date.now()}`
    const svgNS = 'http://www.w3.org/2000/svg'
    const svgEl = document.createElementNS(svgNS, 'svg')
    svgEl.setAttribute('style', 'position:absolute;width:0;height:0;pointer-events:none;overflow:hidden')
    svgEl.setAttribute('aria-hidden', 'true')

    const defs = document.createElementNS(svgNS, 'defs')
    const clipPathEl = document.createElementNS(svgNS, 'clipPath')
    clipPathEl.setAttribute('id', clipId)
    clipPathEl.setAttribute('clipPathUnits', 'userSpaceOnUse')

    const polyEls = FRANCE_RINGS.map(() => {
      const poly = document.createElementNS(svgNS, 'polygon')
      clipPathEl.appendChild(poly)
      return poly
    })

    defs.appendChild(clipPathEl)
    svgEl.appendChild(defs)
    document.body.appendChild(svgEl)

    const updateClip = () => {
      FRANCE_RINGS.forEach((ring, i) => {
        const pts = ring
          .map(([lat, lon]) => {
            const p = map.latLngToLayerPoint(L.latLng(lat, lon))
            return `${p.x},${p.y}`
          })
          .join(' ')
        polyEls[i].setAttribute('points', pts)
      })
    }

    map.getPanes().tilePane.style.clipPath = `url(#${clipId})`
    updateClip()
    // Pan : le clip suit les tuiles automatiquement (même transform parent).
    // Zoom : pixelOrigin change → recalcul nécessaire.
    map.on('zoom viewreset zoomend', updateClip)

    mapInstanceRef.current = map
    return () => {
      map.remove()
      mapInstanceRef.current = null
      if (document.body.contains(svgEl)) document.body.removeChild(svgEl)
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
      const speedMs = station.wind_speed_ms || 0
      const color = getWindColor(speedMs)
      const icon = makeArrowIcon(station.wind_direction, color, 28, speedMs, station.wind_gust_ms)

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
      colorScale: ['#BAE6FD', '#3B82F6', '#1D4ED8', '#FBBF24', '#F97316', '#DC2626', '#7F1D1D'],
    })

    layer.addTo(map)
    velocityLayerRef.current = layer
  }, [gridData, showAnimation])

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
  )
}
