// Leaflet basemap + static network layers (CARTO — native retina, global CDN)
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Network, StationInfo } from '../core/types.ts'

export interface BaseMap {
  map: L.Map
  setTheme: (dark: boolean) => void
  // station clicks and map clicks arrive from the same DOM event — timestamp guard
  // lets main avoid selecting a train underneath a tapped station
  wasStationClick: () => boolean
}

const tileUrl = (dark: boolean) =>
  `https://{s}.basemaps.cartocdn.com/${dark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`

export function createMap(el: string, net: Network, onStationClick: (s: StationInfo) => void): BaseMap {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches
  const map = L.map(el, {
    center: [40.735, -73.97],
    zoom: 12,
    zoomControl: false,
  })
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  const tiles = L.tileLayer(tileUrl(dark), {
    attribution: '© OpenStreetMap © CARTO · Data: MTA New York City Transit',
    maxZoom: 19,
  }).addTo(map)

  const canvasR = L.canvas({ padding: 0.3 })
  const colorOf = Object.fromEntries(net.routes.map((r) => [r.id, r.color]))

  const drawn = new Set<string>()
  for (const shapeId of Object.values(net.defaults)) {
    if (drawn.has(shapeId)) continue
    drawn.add(shapeId)
    const s = net.shapes[shapeId]
    if (!s) continue
    const route = net.shapeRoute[shapeId] ?? shapeId.split('.')[0]
    L.polyline(
      s.pts.map(([lon, lat]) => [lat, lon] as [number, number]),
      { renderer: canvasR, color: colorOf[route] ?? '#666', weight: 2.5, opacity: 0.55, interactive: false },
    ).addTo(map)
  }

  let lastStaClick = 0
  const staMarkers: L.CircleMarker[] = []
  for (const st of net.stations) {
    const m = L.circleMarker([st.lonlat[1], st.lonlat[0]], {
      renderer: canvasR,
      radius: 3,
      color: dark ? '#cfcfcf' : '#333',
      weight: 1,
      fillColor: dark ? '#1b1e24' : '#fff',
      fillOpacity: 1,
    })
      .bindTooltip(st.name, { direction: 'top' })
      .on('click', () => {
        lastStaClick = Date.now()
        onStationClick(st)
      })
      .addTo(map)
    staMarkers.push(m)
  }

  return {
    map,
    wasStationClick: () => Date.now() - lastStaClick < 150,
    setTheme(d: boolean) {
      tiles.setUrl(tileUrl(d))
      for (const m of staMarkers) m.setStyle({ color: d ? '#cfcfcf' : '#333', fillColor: d ? '#1b1e24' : '#fff' })
    },
  }
}
