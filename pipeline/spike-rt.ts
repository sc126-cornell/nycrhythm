// T0.2 GTFS-RT Spike：解碼全部 8 個 MTA 即時餵送，統計結構與量級
// 樣本入 samples/rt-*.sample.json；發現寫入 SPIKE-NOTES.md
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import GtfsRealtimeBindings from 'gtfs-realtime-bindings'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SAMPLES = resolve(ROOT, 'pipeline/samples')
mkdirSync(SAMPLES, { recursive: true })

const BASE = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs'
const FEEDS = [
  { key: 'irt', suffix: '' }, // 1–7＋大中央接駁
  { key: 'ace', suffix: '-ace' },
  { key: 'bdfm', suffix: '-bdfm' },
  { key: 'g', suffix: '-g' },
  { key: 'jz', suffix: '-jz' },
  { key: 'nqrw', suffix: '-nqrw' },
  { key: 'l', suffix: '-l' },
  { key: 'si', suffix: '-si' },
] as const

const { FeedMessage } = GtfsRealtimeBindings.transit_realtime
const now = Math.floor(Date.now() / 1000)

let totalTrips = 0
let totalVehicles = 0
const allRoutes = new Set<string>()

for (const f of FEEDS) {
  const res = await fetch(`${BASE}${f.suffix}`, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) {
    console.log(`❌ ${f.key}: HTTP ${res.status}`)
    continue
  }
  const buf = new Uint8Array(await res.arrayBuffer())
  const feed = FeedMessage.decode(buf)
  const obj = FeedMessage.toObject(feed, { longs: Number }) as {
    header: { timestamp: number; gtfsRealtimeVersion: string }
    entity: Array<{
      tripUpdate?: {
        trip: { tripId: string; routeId: string; startDate?: string }
        stopTimeUpdate?: Array<{ stopId: string; arrival?: { time: number }; departure?: { time: number } }>
      }
      vehicle?: { trip?: { tripId: string; routeId: string }; stopId?: string; currentStatus?: number; timestamp?: number }
      alert?: unknown
    }>
  }

  const tu = obj.entity.filter((e) => e.tripUpdate)
  const veh = obj.entity.filter((e) => e.vehicle)
  const alerts = obj.entity.filter((e) => e.alert)
  const fresh = now - obj.header.timestamp
  const routes = new Set(tu.map((e) => e.tripUpdate!.trip.routeId))
  routes.forEach((r) => allRoutes.add(r))
  totalTrips += tu.length
  totalVehicles += veh.length

  // 未來停靠數分佈（判斷插值可用性）
  const futureStops = tu.map((e) => (e.tripUpdate!.stopTimeUpdate ?? []).filter((s) => (s.arrival?.time ?? s.departure?.time ?? 0) > now).length)
  const withFuture = futureStops.filter((n) => n > 0).length

  console.log(
    `✅ ${f.key.padEnd(5)} ${String(buf.length).padStart(7)}B・新鮮度 ${fresh}s・trips ${String(tu.length).padStart(3)}（含未來停靠 ${withFuture}）・vehicles ${veh.length}・alerts ${alerts.length}・路線 [${[...routes].sort().join(',')}]`,
  )

  writeFileSync(
    resolve(SAMPLES, `rt-${f.key}.sample.json`),
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        headerTimestamp: obj.header.timestamp,
        freshnessSec: fresh,
        counts: { entities: obj.entity.length, tripUpdates: tu.length, vehicles: veh.length, alerts: alerts.length },
        routeIds: [...routes].sort(),
        sampleTripUpdates: tu.slice(0, 3).map((e) => ({
          trip: e.tripUpdate!.trip,
          stopTimeUpdate: (e.tripUpdate!.stopTimeUpdate ?? []).slice(0, 5),
        })),
        sampleVehicles: veh.slice(0, 3).map((e) => e.vehicle),
      },
      null,
      2,
    ),
  )
  await new Promise((r) => setTimeout(r, 300))
}

console.log(`\n=== 總計：進行中 trips ${totalTrips}・vehicles ${totalVehicles}・路線 ${allRoutes.size} 條 ===`)
console.log('路線全集:', [...allRoutes].sort().join(', '))
