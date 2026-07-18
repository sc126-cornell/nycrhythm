import './style.css'
import { createMap } from './map/basemap.ts'
import { TrainsLayer, type DrawItem, type StationLabel } from './map/trains.ts'
import { GeoStore, stationNameOf } from './core/geo.ts'
import { RtStore } from './core/rt.ts'
import { positionOf, type TrainState } from './core/position.ts'
import { initTheme } from './ui/theme.ts'
import { initStationBoard } from './ui/stationboard.ts'
import { initSearch } from './ui/search.ts'
import { parseHash, writeHash } from './ui/deeplink.ts'
import type { LiveTrip, Network, Pt, StationInfo } from './core/types.ts'

export const BUILD = 'M3a-20260719'

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

const distM = (a: Pt, b: Pt): number => {
  const rad = Math.PI / 180
  const x = (b[0] - a[0]) * rad * Math.cos(((a[1] + b[1]) / 2) * rad)
  const y = (b[1] - a[1]) * rad
  return Math.hypot(x, y) * 6371000
}

async function boot() {
  const net = (await fetch('/data/network.json').then((r) => r.json())) as Network
  const geo = new GeoStore(net)
  const rt = new RtStore()
  const colorOf = Object.fromEntries(net.routes.map((r) => [r.id, r.color]))

  // ---- selection / follow state ----
  let selected: LiveTrip | null = null
  let lastState: TrainState | null = null
  let follow: 'off' | 'lock' | 'free' = 'off'
  let speedKmh = 0
  let lastSample: { t: number; lonlat: Pt } | null = null
  let infoBuilt = false
  let pendingFollow: string | null = null
  let pendingUntil = 0

  const isMobile = () => matchMedia('(max-width: 640px)').matches

  const { map, setTheme, wasStationClick } = createMap('map', net, (s) => {
    board.open(s)
    focusStation(s)
  })
  const trains = new TrainsLayer(map)
  let isDark = false
  initTheme((d) => {
    isDark = d
    setTheme(d)
  })

  console.info(`nycrhythm BUILD ${BUILD}`)

  // bottom-sheet board on mobile: lift the focused station into the visible upper area
  function focusStation(s: StationInfo, minZoom = 0) {
    map.setView([s.lonlat[1], s.lonlat[0]], Math.max(map.getZoom(), minZoom))
    if (isMobile()) map.panBy([0, map.getSize().y * 0.22], { animate: false })
  }

  // station labels: one per complex, positioned at the group centroid (M2 review item)
  const labels: StationLabel[] = []
  {
    const groups = new Map<string, { name: string; pts: Pt[] }>()
    for (const st of net.stations) {
      const key = st.cx ? `cx:${st.cx}` : `n:${st.name}:${st.id}`
      let g = groups.get(st.cx ? key : `n:${st.name}`)
      if (!g) groups.set(st.cx ? key : `n:${st.name}`, (g = { name: st.name, pts: [] }))
      g.pts.push(st.lonlat)
    }
    for (const g of groups.values()) {
      labels.push({
        lonlat: [g.pts.reduce((a, p) => a + p[0], 0) / g.pts.length, g.pts.reduce((a, p) => a + p[1], 0) / g.pts.length],
        name: g.name,
      })
    }
  }

  const board = initStationBoard(net, rt, colorOf, () => syncHash())
  initSearch(net, (s) => {
    board.open(s)
    focusStation(s, 14)
  })

  // ---- info card (skeleton once; per-frame text updates — iOS rule) ----
  const infoEl = document.getElementById('traininfo')!
  const backBtn = document.getElementById('backBtn')!

  function setFollow(mode: 'off' | 'lock' | 'free') {
    follow = mode
    infoBuilt = false
    backBtn.classList.toggle('hidden', mode !== 'free')
    syncHash()
  }

  function select(trip: LiveTrip | null, state: TrainState | null) {
    selected = trip
    lastState = state
    speedKmh = 0
    lastSample = null
    infoBuilt = false
    if (!trip) setFollow('off')
    renderInfo()
    syncHash()
  }

  function buildInfoSkeleton() {
    if (!selected) return
    const color = colorOf[selected.route] ?? '#666'
    const followBtn =
      follow === 'off' ? '<button data-act="follow">🎥 Follow</button>' : '<button data-act="unfollow">Unfollow</button>'
    infoEl.innerHTML =
      `<div><span class="bullet" style="background:${color}">${selected.route}</span>` +
      `<b id="tiDest"></b></div>` +
      `<div class="ti-sub"><span id="tiNext"></span> · <span id="tiSpd">0</span> km/h</div>` +
      `<div class="ti-btns">${followBtn}<button data-act="close">✕ Close</button>` +
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
    document.getElementById('tiSpd')!.textContent = String(Math.round(speedKmh))
    document.getElementById('tiTrip')!.textContent = selected.id
  }

  infoEl.addEventListener('click', (e) => {
    const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act
    if (act === 'close') select(null, null)
    if (act === 'unfollow') setFollow('off')
    if (act === 'follow' && lastState) {
      if (map.getZoom() < 13) map.setView([lastState.lonlat[1], lastState.lonlat[0]], 14)
      setFollow('lock')
    }
  })
  backBtn.addEventListener('click', () => setFollow('lock'))
  map.on('dragstart', () => {
    if (follow === 'lock') setFollow('free')
  })

  map.on('click', (e) => {
    if (wasStationClick()) return
    const hit = trains.hitTest(e.containerPoint.x, e.containerPoint.y)
    select(hit?.trip ?? null, hit)
  })

  // ---- deep link ----
  function syncHash() {
    const c = map.getCenter()
    writeHash({
      c: [c.lat, c.lng],
      z: map.getZoom(),
      f: follow !== 'off' && selected ? selected.id : undefined,
      s: board.current?.id,
    })
  }
  map.on('moveend', syncHash)

  {
    const dl = parseHash()
    if (dl.c) map.setView(dl.c, dl.z ?? map.getZoom())
    if (dl.s) {
      const s = net.stations.find((x) => x.id === dl.s)
      if (s) {
        board.open(s)
        if (!dl.c) focusStation(s, 14)
      }
    }
    if (dl.f) {
      pendingFollow = dl.f
      pendingUntil = Date.now() + 30_000 // trip may appear on a later poll; stale links time out silently
    }
  }

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
      if (pendingFollow && trip.id === pendingFollow) {
        select(trip, st)
        map.setView([st.lonlat[1], st.lonlat[0]], Math.max(map.getZoom(), 14))
        setFollow('lock')
        pendingFollow = null
      }
      const isSel = trip.id === selected?.id
      if (isSel) {
        selectedAlive = true
        selected = trip
        if (lastSample && now > lastSample.t) {
          const v = (distM(lastSample.lonlat, st.lonlat) / (now - lastSample.t)) * 3.6
          speedKmh = speedKmh * 0.85 + v * 0.15
        }
        lastSample = { t: now, lonlat: st.lonlat }
        lastState = st
      }
      items.push({ st, color: colorOf[trip.route] ?? '#666', letter: trip.route.slice(0, 2), selected: isSel })
    }
    if (pendingFollow && Date.now() > pendingUntil) pendingFollow = null
    trains.draw(items, labels, isDark)
    board.tick(now)

    liveCount.textContent = rt.active ? `${items.length} trains live` : items.length ? `${items.length} trains (stale)` : 'connecting…'
    clockEl.textContent = nycClock.format(new Date())

    if (selected) {
      if (!selectedAlive) select(null, null)
      else {
        if (follow === 'lock' && lastState) map.panTo([lastState.lonlat[1], lastState.lonlat[0]], { animate: false })
        renderInfo()
      }
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
