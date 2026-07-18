// T1.2 路網建置：GTFS 靜態 → web/public/data/network.json
// routes（官方色）/ 母站＋complex / 257 shape 變體（DP 簡化＋里程）/ 每變體停靠投影 stopKm / defaults
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { Gtfs, cumLen, project, type Pt } from './gtfs.ts'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const gtfs = new Gtfs(resolve(ROOT, 'pipeline/raw/gtfs_subway.zip'))
const OUT = resolve(ROOT, 'web/public/data')
mkdirSync(OUT, { recursive: true })

const warnings: string[] = []
const round5 = (v: number) => Math.round(v * 1e5) / 1e5

// ---- Douglas-Peucker 簡化（平面近似，容差公尺）----
function simplify(pts: Pt[], tolM = 6): Pt[] {
  if (pts.length <= 2) return pts
  const ky = 111320
  const kx = ky * Math.cos((pts[0][1] * Math.PI) / 180)
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack: Array<[number, number]> = [[0, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()!
    let maxD = 0
    let maxI = -1
    const ax = pts[a][0] * kx
    const ay = pts[a][1] * ky
    const bx = pts[b][0] * kx
    const by = pts[b][1] * ky
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy || 1
    for (let i = a + 1; i < b; i++) {
      const px = pts[i][0] * kx - ax
      const py = pts[i][1] * ky - ay
      const t = Math.max(0, Math.min(1, (px * dx + py * dy) / len2))
      const d = Math.hypot(px - t * dx, py - t * dy)
      if (d > maxD) {
        maxD = d
        maxI = i
      }
    }
    if (maxD > tolM && maxI > 0) {
      keep[maxI] = 1
      stack.push([a, maxI], [maxI, b])
    }
  }
  return pts.filter((_, i) => keep[i] === 1)
}

// ---- routes：官方幹線色為底、GTFS route_color 優先 ----
const TRUNK: Record<string, string> = {
  A: '#0039A6', C: '#0039A6', E: '#0039A6',
  B: '#FF6319', D: '#FF6319', F: '#FF6319', FX: '#FF6319', M: '#FF6319',
  G: '#6CBE45',
  J: '#996633', Z: '#996633',
  L: '#A7A9AC',
  N: '#FCCC0A', Q: '#FCCC0A', R: '#FCCC0A', W: '#FCCC0A',
  '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',
  '4': '#00933C', '5': '#00933C', '6': '#00933C', '6X': '#00933C',
  '7': '#B933AD', '7X': '#B933AD',
  GS: '#808183', FS: '#808183', H: '#808183',
  SI: '#0039A6',
}
const routes = gtfs.records('routes.txt').map((r) => ({
  id: r.route_id,
  name: r.route_long_name,
  color: r.route_color ? `#${r.route_color}` : (TRUNK[r.route_id] ?? '#666666'),
}))

// ---- stops：母站＋月台→母站對應 ----
const stopRecs = gtfs.records('stops.txt')
const stations = stopRecs
  .filter((s) => s.location_type === '1')
  .map((s) => ({ id: s.stop_id, name: s.stop_name, lonlat: [round5(Number(s.stop_lon)), round5(Number(s.stop_lat))] as Pt }))
const platToSta: Record<string, string> = {}
const platPt = new Map<string, Pt>()
for (const s of stopRecs) {
  if (s.location_type !== '1') {
    platToSta[s.stop_id] = s.parent_station || s.stop_id
    platPt.set(s.stop_id, [Number(s.stop_lon), Number(s.stop_lat)])
  }
}

// ---- complex：transfers 併查集 ----
const parent = new Map<string, string>()
const find = (x: string): string => {
  const p = parent.get(x) ?? x
  if (p === x) return x
  const r = find(p)
  parent.set(x, r)
  return r
}
for (const t of gtfs.records('transfers.txt')) {
  const a = t.from_stop_id
  const b = t.to_stop_id
  if (!a || !b || a === b) continue
  parent.set(find(a), find(b))
}
const cxCount = new Map<string, number>()
for (const st of stations) cxCount.set(find(st.id), (cxCount.get(find(st.id)) ?? 0) + 1)
const stationsOut = stations.map((st) => {
  const cx = find(st.id)
  return (cxCount.get(cx) ?? 1) > 1 ? { ...st, cx } : st
})

// ---- shapes：分組→簡化→里程 ----
const shapePts = new Map<string, Array<{ seq: number; pt: Pt }>>()
gtfs.eachLineFast('shapes.txt', (f, h) => {
  const id = f[h.indexOf('shape_id')]
  let arr = shapePts.get(id)
  if (!arr) shapePts.set(id, (arr = []))
  arr.push({ seq: Number(f[h.indexOf('shape_pt_sequence')]), pt: [Number(f[h.indexOf('shape_pt_lon')]), Number(f[h.indexOf('shape_pt_lat')])] })
})
let rawPts = 0
let simpPts = 0
const shapes: Record<string, { pts: Pt[]; chain: number[]; stops: Record<string, number> }> = {}
for (const [id, arr] of shapePts) {
  arr.sort((a, b) => a.seq - b.seq)
  const pts = simplify(arr.map((x) => x.pt))
  rawPts += arr.length
  simpPts += pts.length
  shapes[id] = { pts: pts.map(([x, y]) => [round5(x), round5(y)] as Pt), chain: cumLen(pts).map(Math.round), stops: {} }
}

// ---- trips：每 shape 代表 trip＋route/dir；defaults=最長變體 ----
const tripRecs = gtfs.records('trips.txt')
const repTrip = new Map<string, string>() // shapeId → tripId
const shapeRoute = new Map<string, string>()
for (const t of tripRecs) {
  if (t.shape_id && !repTrip.has(t.shape_id)) {
    repTrip.set(t.shape_id, t.trip_id)
    shapeRoute.set(t.shape_id, t.route_id)
  }
}
const repTripIds = new Map<string, string>() // tripId → shapeId
for (const [sh, tr] of repTrip) repTripIds.set(tr, sh)

// ---- stop_times：只掃代表 trips，收集停靠序 ----
const seqByShape = new Map<string, Array<{ seq: number; stop: string }>>()
gtfs.eachLineFast('stop_times.txt', (f, h) => {
  const trip = f[h.indexOf('trip_id')]
  const sh = repTripIds.get(trip)
  if (!sh) return
  let arr = seqByShape.get(sh)
  if (!arr) seqByShape.set(sh, (arr = []))
  arr.push({ seq: Number(f[h.indexOf('stop_sequence')]), stop: f[h.indexOf('stop_id')] })
})

// ---- 投影 stopKm ----
let projWarn = 0
for (const [sh, arr] of seqByShape) {
  arr.sort((a, b) => a.seq - b.seq)
  const s = shapes[sh]
  if (!s) continue
  const cum = cumLen(s.pts)
  let lastM = -1
  let mono = true
  for (const { stop } of arr) {
    const p = platPt.get(stop)
    if (!p) continue
    const pr = project(p, s.pts, cum)
    if (pr.off > 150) {
      projWarn++
      warnings.push(`${sh} ${stop}: 投影偏移 ${pr.off.toFixed(0)}m`)
    }
    s.stops[stop] = Math.round(pr.m)
    if (pr.m < lastM) mono = false
    lastM = pr.m
  }
  if (!mono) warnings.push(`⚠️ ${sh}: stopKm 非單調`)
}

// ---- defaults：route+方向字母 → 最長（停靠最多）變體 ----
const dirOf = (shapeId: string): string | null => shapeId.match(/\.\.?([NS])/)?.[1] ?? null
const defaults: Record<string, string> = {}
for (const [sh] of shapePts) {
  const route = shapeRoute.get(sh)
  const d = dirOf(sh)
  if (!route || !d) {
    warnings.push(`defaults 略過（無法解析方向）: ${sh}`)
    continue
  }
  const key = `${route}|${d}`
  const cur = defaults[key]
  if (!cur || Object.keys(shapes[sh]?.stops ?? {}).length > Object.keys(shapes[cur]?.stops ?? {}).length) defaults[key] = sh
}

// ---- 輸出 ----
const out = {
  version: new Date().toISOString().slice(0, 10),
  generatedAt: new Date().toISOString(),
  meta: { warnings: warnings.slice(0, 60) },
  routes,
  stations: stationsOut,
  platToSta,
  shapes,
  shapeRoute: Object.fromEntries(shapeRoute),
  defaults,
}
const json = JSON.stringify(out)
writeFileSync(resolve(OUT, 'network.json'), json)

console.log(`routes ${routes.length}・母站 ${stationsOut.length}（complex ${[...cxCount.values()].filter((n) => n > 1).length} 群）・月台 ${Object.keys(platToSta).length}`)
console.log(`shapes ${Object.keys(shapes).length}・點 ${rawPts.toLocaleString()} → 簡化後 ${simpPts.toLocaleString()}（${((simpPts / rawPts) * 100).toFixed(0)}%）`)
console.log(`defaults ${Object.keys(defaults).length} 鍵・投影警示 ${projWarn}・警告 ${warnings.length}`)
console.log(`network.json ${(json.length / 1048576).toFixed(2)}MB・gzip ${(gzipSync(json).length / 1048576).toFixed(2)}MB`)
