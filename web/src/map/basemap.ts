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

// CARTO stopped serving keyless raster tiles on 2026-09-25 (they return an "API KEY REQUIRED"
// watermark instead). The key rides in the bundle on purpose: the Basemap Terms forbid serving
// tiles through our own proxy or cache (9.c.iii), so the key is guarded by the host allowlist
// set on it in the CARTO dashboard, not by being kept out of the client.
const CARTO_KEY = import.meta.env.VITE_CARTO_KEY ?? ''

const tileUrl = (dark: boolean) =>
  `https://basemaps.cartocdn.com/rastertiles/${dark ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`

export function createMap(el: string, net: Network, onStationClick: (s: StationInfo) => void): BaseMap {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches
  const map = L.map(el, {
    center: [40.735, -73.97],
    zoom: 12,
    zoomControl: false,
  })
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  const tiles = L.tileLayer(tileUrl(dark), {
    // both credits must be visible and linked, or CARTO may revoke the key (Basemap Terms 13)
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
      '© <a href="https://carto.com/attributions/">CARTO</a> · Data: MTA New York City Transit',
    maxZoom: 19,
  }).addTo(map)

  // tolerance widens the tap hit-area beyond the visible dot (field feedback: hard to tap)
  const canvasR = L.canvas({ padding: 0.3, tolerance: 8 })
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

  const staRadius = (z: number) => (z >= 15 ? 6 : z >= 13.5 ? 5 : z >= 12 ? 4 : 3)
  let lastStaClick = 0
  const staMarkers: L.CircleMarker[] = []
  for (const st of net.stations) {
    const m = L.circleMarker([st.lonlat[1], st.lonlat[0]], {
      renderer: canvasR,
      radius: staRadius(map.getZoom()),
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
  map.on('zoomend', () => {
    const r = staRadius(map.getZoom())
    for (const m of staMarkers) m.setStyle({ radius: r, weight: r >= 5 ? 1.5 : 1 })
  })

  return {
    map,
    wasStationClick: () => Date.now() - lastStaClick < 150,
    setTheme(d: boolean) {
      tiles.setUrl(tileUrl(d))
      for (const m of staMarkers) m.setStyle({ color: d ? '#cfcfcf' : '#333', fillColor: d ? '#1b1e24' : '#fff' })
    },
  }
}
