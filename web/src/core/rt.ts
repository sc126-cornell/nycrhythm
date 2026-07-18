// GTFS-RT client store: poll all 8 slim feeds via /api/rt, merge trips,
// track "departed previous stop" transitions (needed to interpolate trains that are
// already between stations — GTFS-RT stopTimeUpdate lists FUTURE stops only),
// and clean up trips not seen for a while.
import type { LiveTrip, RtStop } from './types.ts'

const FEEDS = ['irt', 'ace', 'bdfm', 'g', 'jz', 'nqrw', 'l', 'si'] as const
// Local dev has no Vercel functions — hit production API (CORS enabled there)
const API_BASE = import.meta.env.DEV ? 'https://nycrhythm.scottchen0622.com' : ''

interface RtResponse {
  ok: boolean
  trips?: Array<{ t: string; r: string; u: RtStop[] }>
}

export class RtStore {
  readonly trips = new Map<string, LiveTrip>()
  lastOk = 0

  get active(): boolean {
    return Date.now() - this.lastOk < 75_000
  }

  async poll(): Promise<void> {
    const results = await Promise.allSettled(
      FEEDS.map((f) =>
        fetch(`${API_BASE}/api/rt?feed=${f}`).then((r) => (r.ok ? (r.json() as Promise<RtResponse>) : Promise.reject(new Error(String(r.status))))),
      ),
    )
    const now = Date.now()
    let any = false
    for (const res of results) {
      if (res.status !== 'fulfilled' || !res.value.ok || !Array.isArray(res.value.trips)) continue
      any = true
      for (const t of res.value.trips) {
        if (!t.u.length) continue
        const old = this.trips.get(t.t)
        let prev = old?.prev ?? null
        // first-stop changed → the train departed the old first stop around now
        if (old && old.stops.length && t.u[0].s !== old.stops[0].s) {
          prev = { s: old.stops[0].s, at: now }
        }
        this.trips.set(t.t, {
          id: t.t,
          route: t.r,
          stops: t.u,
          seenAt: now,
          prev,
          firstSeen: old?.firstSeen ?? now,
        })
      }
    }
    if (any) this.lastOk = now
    for (const [k, v] of this.trips) if (now - v.seenAt > 180_000) this.trips.delete(k)
  }
}
