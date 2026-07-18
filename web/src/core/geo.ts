// Shape geometry access + RT trip → shape resolution
import type { Network, Pt, ShapeData } from './types.ts'

export class ShapeGeo {
  readonly id: string
  private readonly d: ShapeData
  /** platforms ordered by km along the shape (the "ladder") */
  readonly ladder: Array<{ s: string; km: number }>

  constructor(id: string, d: ShapeData) {
    this.id = id
    this.d = d
    this.ladder = Object.entries(d.stops)
      .map(([s, km]) => ({ s, km }))
      .sort((a, b) => a.km - b.km)
  }

  kmOf(platform: string): number | undefined {
    return this.d.stops[platform]
  }

  /** platform on the ladder immediately before the given km */
  prevOnLadder(km: number): { s: string; km: number } | null {
    let best: { s: string; km: number } | null = null
    for (const e of this.ladder) {
      if (e.km < km - 1) best = e
      else break
    }
    return best
  }

  pointAt(m: number): Pt {
    const c = this.d.chain
    const pts = this.d.pts
    const last = c.length - 1
    if (m <= c[0]) return pts[0]
    if (m >= c[last]) return pts[last]
    let lo = 0
    let hi = last
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (c[mid] <= m) lo = mid
      else hi = mid
    }
    const t = (m - c[lo]) / (c[hi] - c[lo] || 1)
    const a = pts[lo]
    const b = pts[hi]
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  }
}

export class GeoStore {
  private cache = new Map<string, ShapeGeo>()
  constructor(private net: Network) {}

  get(shapeId: string): ShapeGeo | null {
    const hit = this.cache.get(shapeId)
    if (hit) return hit
    const d = this.net.shapes[shapeId]
    if (!d) return null
    const g = new ShapeGeo(shapeId, d)
    this.cache.set(shapeId, g)
    return g
  }

  /** tripId "089850_1..N03R" → direct shape match, else route+direction default */
  resolve(tripId: string, route: string): ShapeGeo | null {
    const path = tripId.slice(tripId.indexOf('_') + 1)
    const direct = this.get(path)
    if (direct) return direct
    const dir = path.match(/\.\.?([NS])/)?.[1]
    if (!dir) return null
    const def = this.net.defaults[`${route}|${dir}`]
    return def ? this.get(def) : null
  }
}

export function stationNameOf(net: Network, platform: string): string {
  const staId = net.platToSta[platform] ?? platform
  return net.stations.find((s) => s.id === staId)?.name ?? platform
}
