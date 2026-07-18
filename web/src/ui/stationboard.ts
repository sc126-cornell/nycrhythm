// Station arrivals board — derived purely from GTFS-RT (no static timetable).
// Aggregates all platforms of the station's transfer complex.
// iOS rule: rebuild rows only when the train set changes; per-second ticks touch
// countdown text nodes only.
import type { Network, StationInfo } from '../core/types.ts'
import type { RtStore } from '../core/rt.ts'
import { stationNameOf } from '../core/geo.ts'

export interface StationBoard {
  open(sta: StationInfo): void
  close(): void
  readonly current: StationInfo | null
  tick(nowSec: number): void
}

interface Row {
  tripId: string
  route: string
  color: string
  dest: string
  eta: number
}

export function initStationBoard(
  net: Network,
  rt: RtStore,
  colorOf: Record<string, string>,
  onChange: () => void,
): StationBoard {
  const el = document.getElementById('stationboard')!

  // stationId → platform-id set covering its whole complex
  const groupOf = new Map<string, string[]>()
  {
    const byCx = new Map<string, string[]>()
    for (const s of net.stations) {
      if (!s.cx) continue
      let arr = byCx.get(s.cx)
      if (!arr) byCx.set(s.cx, (arr = []))
      arr.push(s.id)
    }
    for (const s of net.stations) groupOf.set(s.id, s.cx ? byCx.get(s.cx)! : [s.id])
  }
  const platformsFor = (staId: string): Set<string> => {
    const stations = new Set(groupOf.get(staId) ?? [staId])
    const out = new Set<string>()
    for (const [plat, parent] of Object.entries(net.platToSta)) if (stations.has(parent)) out.add(plat)
    return out
  }

  let current: StationInfo | null = null
  let platforms: Set<string> = new Set()
  let sig = ''
  let lastKey = -1

  el.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-close]')) api.close()
  })

  const collect = (nowSec: number): Row[] => {
    const rows: Row[] = []
    for (const trip of rt.trips.values()) {
      for (const u of trip.stops) {
        if (!platforms.has(u.s) || u.a < nowSec - 20) continue
        rows.push({
          tripId: trip.id,
          route: trip.route,
          color: colorOf[trip.route] ?? '#666',
          dest: stationNameOf(net, trip.stops[trip.stops.length - 1].s),
          eta: u.a - nowSec,
        })
        break // earliest matching stop per trip
      }
    }
    rows.sort((a, b) => a.eta - b.eta)
    return rows.slice(0, 12)
  }

  const etaText = (eta: number) => (eta < 45 ? 'now' : `${Math.max(1, Math.round(eta / 60))} min`)

  function render(nowSec: number) {
    if (!current) return
    const rows = collect(nowSec)
    const newSig = current.id + '|' + rows.map((r) => r.tripId).join(',')
    if (newSig === sig) {
      const etas = el.querySelectorAll<HTMLElement>('.eta')
      rows.forEach((r, i) => {
        const node = etas[i]
        if (node) {
          node.textContent = etaText(r.eta)
          node.classList.toggle('soon', r.eta < 45)
        }
      })
      return
    }
    sig = newSig

    let html =
      `<div class="sb-head"><b>${current.name}</b>` +
      `<button data-close title="Close">✕</button></div>`
    if (!rows.length) {
      html += `<div class="sb-empty">No trains approaching right now</div>`
    } else {
      for (const r of rows) {
        html +=
          `<div class="sb-row"><span class="dest"><span class="bullet sm" style="background:${r.color}">${r.route}</span>` +
          `${r.dest}</span><span class="eta${r.eta < 45 ? ' soon' : ''}">${etaText(r.eta)}</span></div>`
      }
      html += `<div class="sb-foot">Live MTA arrivals · updates every 20s</div>`
    }
    el.innerHTML = html
  }

  const api: StationBoard = {
    get current() {
      return current
    },
    open(sta) {
      current = sta
      platforms = platformsFor(sta.id)
      sig = ''
      lastKey = -1
      el.classList.remove('hidden')
      render(Date.now() / 1000)
      onChange()
    },
    close() {
      if (!current) return
      current = null
      sig = ''
      el.classList.add('hidden')
      onChange()
    },
    tick(nowSec) {
      if (!current) return
      const key = Math.floor(nowSec)
      if (key !== lastKey) {
        lastKey = key
        render(nowSec)
      }
    },
  }
  return api
}
