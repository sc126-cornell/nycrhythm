// RT position engine: place a live trip on its shape at unix-time `now`
// GTFS-RT lists FUTURE stops only, so a train between stations has stops[0] = NEXT stop.
// Sources for the "from" end of the current segment, in order of preference:
//   1) trip.prev — observed departure (first-stop change between polls)
//   2) shape ladder — platform immediately before the next stop
import type { LiveTrip, Pt } from './types.ts'
import type { ShapeGeo } from './geo.ts'

export interface TrainState {
  trip: LiveTrip
  lonlat: Pt
  aheadLonlat: Pt
  moving: boolean
  nextStop: string // platform id the train is heading to (or standing at)
  etaSec: number // seconds until that stop (0 when standing)
}

const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - ((2 - 2 * p) * (2 - 2 * p)) / 2)
const TERMINAL_LINGER = 45 // keep arrived trains on screen briefly

export function positionOf(trip: LiveTrip, now: number, geo: ShapeGeo): TrainState | null {
  // keep only stops we can place on this shape
  const stops = trip.stops.filter((u) => geo.kmOf(u.s) !== undefined)
  if (!stops.length) return null
  const last = stops[stops.length - 1]
  if (now > last.a + TERMINAL_LINGER) return null

  const state = (km: number, toward: number, nextStop: string, etaSec: number, moving: boolean): TrainState => {
    const sign = Math.sign(toward - km) || 1
    return {
      trip,
      lonlat: geo.pointAt(km),
      aheadLonlat: geo.pointAt(km + sign * 25),
      moving,
      nextStop,
      etaSec,
    }
  }

  // standing at terminal (or just arrived)
  if (now >= last.a) {
    const km = geo.kmOf(last.s)!
    const prevKm = stops.length > 1 ? geo.kmOf(stops[stops.length - 2].s)! : km - 50
    return state(km, km + (km - prevKm), last.s, 0, false)
  }

  // find bracket inside listed stops: a_i ≤ now < a_{i+1}
  for (let i = 0; i < stops.length - 1; i++) {
    if (stops[i].a <= now && now < stops[i + 1].a) {
      const kmA = geo.kmOf(stops[i].s)!
      const kmB = geo.kmOf(stops[i + 1].s)!
      const span = stops[i + 1].a - stops[i].a || 1
      // treat the first ~25s after an arrival prediction as dwell at the platform
      const dwell = Math.min(25, span * 0.3)
      const p = Math.max(0, (now - stops[i].a - dwell) / Math.max(1, span - dwell))
      if (p <= 0) return state(kmA, kmB, stops[i].s, 0, false)
      return state(kmA + (kmB - kmA) * ease(Math.min(1, p)), kmB, stops[i + 1].s, stops[i + 1].a - now, true)
    }
  }

  // before first listed stop: train is en route to stops[0]
  const next = stops[0]
  const kmNext = geo.kmOf(next.s)!
  let fromKm: number | null = null
  let fromAt: number | null = null
  if (trip.prev) {
    const pk = geo.kmOf(trip.prev.s)
    if (pk !== undefined) {
      fromKm = pk
      fromAt = trip.prev.at / 1000
    }
  }
  if (fromKm === null) {
    const ladderPrev = geo.prevOnLadder(kmNext)
    if (ladderPrev) {
      fromKm = ladderPrev.km
      // no departure timestamp known: assume it left when we first saw the trip
      fromAt = Math.min(trip.firstSeen / 1000, next.a - 30)
    }
  }
  if (fromKm === null || fromAt === null || fromAt >= next.a) {
    // origin terminal or unplaceable: stand at the next stop's platform
    return state(kmNext, kmNext + 50, next.s, Math.max(0, next.a - now), false)
  }
  const p = ease(Math.min(1, Math.max(0, (now - fromAt) / (next.a - fromAt))))
  return state(fromKm + (kmNext - fromKm) * p, kmNext, next.s, next.a - now, p > 0 && p < 1)
}
