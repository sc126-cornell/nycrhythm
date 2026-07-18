import './style.css'
import { createMap } from './map/basemap.ts'
import { TrainsLayer, type DrawItem, type StationLabel } from './map/trains.ts'
import { GeoStore, stationNameOf } from './core/geo.ts'
import { RtStore } from './core/rt.ts'
import { positionOf, type TrainState } from './core/position.ts'
import { initTheme } from './ui/theme.ts'
import type { LiveTrip, Network } from './core/types.ts'

export const BUILD = 'M2a-20260719'

// surface uncaught errors to the badge (no console on mobile)
window.addEventListener('error', (e) => {
  const el = document.getElementById('liveCount')
  if (el) el.textContent = `⚠ ${String(e.message).slice(0, 40)}`
})
window.addEventListener('unhandledrejection', (e) => {
  const el = document.getElementById('liveCount')
  if (el) el.textContent = `⚠ ${String(e.reason).slice(0, 40)}`
})

const nycClock = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

async function boot() {
  const net = (await fetch('/data/network.json').then((r) => r.json())) as Network
  const geo = new GeoStore(net)
  const rt = new RtStore()
  const colorOf = Object.fromEntries(net.routes.map((r) => [r.id, r.color]))

  const { map, setTheme } = createMap('map', net)
  const trains = new TrainsLayer(map)
  let isDark = false
  initTheme((d) => {
    isDark = d
    setTheme(d)
  })

  console.info(`nycrhythm BUILD ${BUILD}`)

  // station labels: one per complex/name cluster (parent stations already deduped per line)
  const labels: StationLabel[] = []
  {
    const seen = new Map<string, boolean>()
    for (const st of net.stations) {
      const key = st.cx ? `cx:${st.cx}` : `${st.name}`
      if (seen.has(key)) continue
      seen.set(key, true)
      labels.push({ lonlat: st.lonlat, name: st.name })
    }
  }

  // ---- selection / info card (skeleton built once; text nodes updated per frame — iOS rule) ----
  const infoEl = document.getElementById('traininfo')!
  let selected: LiveTrip | null = null
  let lastState: TrainState | null = null
  let infoBuilt = false

  function buildInfoSkeleton() {
    if (!selected) return
    const color = colorOf[selected.route] ?? '#666'
    infoEl.innerHTML =
      `<div><span class="bullet" style="background:${color}">${selected.route}</span>` +
      `<b id="tiDest"></b></div>` +
      `<div class="ti-sub"><span id="tiNext"></span></div>` +
      `<div class="ti-btns"><button data-act="close">✕ Close</button>` +
      `<small id="tiTrip"></small></div>`
    infoEl.classList.remove('hidden')
    infoBuilt = true
  }

  function renderInfo() {
    if (!selected || !lastState) {
      infoEl.classList.add('hidden')
      infoBuilt = false
      return
    }
    if (!infoBuilt) buildInfoSkeleton()
    const lastStop = selected.stops[selected.stops.length - 1]
    document.getElementById('tiDest')!.textContent = `To ${stationNameOf(net, lastStop.s)}`
    const eta = Math.max(0, Math.round(lastState.etaSec))
    document.getElementById('tiNext')!.textContent = lastState.moving
      ? `Next: ${stationNameOf(net, lastState.nextStop)} · ${Math.floor(eta / 60)}m ${String(eta % 60).padStart(2, '0')}s`
      : `At ${stationNameOf(net, lastState.nextStop)}`
    document.getElementById('tiTrip')!.textContent = selected.id
  }

  infoEl.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-act="close"]')) {
      selected = null
      lastState = null
      renderInfo()
    }
  })

  map.on('click', (e) => {
    const hit = trains.hitTest(e.containerPoint.x, e.containerPoint.y)
    selected = hit?.trip ?? null
    lastState = hit
    infoBuilt = false
    renderInfo()
  })

  // ---- polling ----
  const liveCount = document.getElementById('liveCount')!
  const clockEl = document.getElementById('nyClock')!
  const doPoll = () => {
    if (!document.hidden) void rt.poll()
  }
  doPoll()
  setInterval(doPoll, 20_000)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) doPoll()
  })

  // ---- render loop ----
  const params = new URLSearchParams(location.search)
  const eco = params.has('eco') || /Mobi|Android/i.test(navigator.userAgent)
  const fpsEl = params.has('fps') ? document.getElementById('fpsMeter') : null
  fpsEl?.classList.remove('hidden')
  let frames = 0
  let fpsWindow = performance.now()
  let lastFrame = 0

  function frame(nowMs: number) {
    requestAnimationFrame(frame)
    if (eco && nowMs - lastFrame < 30) return
    lastFrame = nowMs

    const now = Date.now() / 1000
    const items: DrawItem[] = []
    let selectedAlive = false
    for (const trip of rt.trips.values()) {
      const g = geo.resolve(trip.id, trip.route)
      if (!g) continue
      const st = positionOf(trip, now, g)
      if (!st) continue
      const isSel = trip.id === selected?.id
      if (isSel) {
        selectedAlive = true
        selected = trip
        lastState = st
      }
      items.push({ st, color: colorOf[trip.route] ?? '#666', letter: trip.route.slice(0, 2), selected: isSel })
    }
    trains.draw(items, labels, isDark)

    liveCount.textContent = rt.active ? `${items.length} trains live` : items.length ? `${items.length} trains (stale)` : 'connecting…'
    clockEl.textContent = nycClock.format(new Date())

    if (selected) {
      if (!selectedAlive) {
        selected = null
        lastState = null
      }
      renderInfo()
    }

    if (fpsEl) {
      frames++
      if (nowMs - fpsWindow >= 1000) {
        fpsEl.textContent = `${frames} fps · ${items.length} trains`
        frames = 0
        fpsWindow = nowMs
      }
    }
  }
  requestAnimationFrame(frame)
}

boot().catch((err) => {
  document.getElementById('liveCount')!.textContent = 'failed to load'
  console.error(err)
})
