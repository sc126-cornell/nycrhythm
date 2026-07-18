// M1 驗證：RT tripId → shape 對應率抽測（門檻：直配＋墊底合計 ≥90%）
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import GtfsRealtimeBindings from 'gtfs-realtime-bindings'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const net = JSON.parse(readFileSync(resolve(ROOT, 'web/public/data/network.json'), 'utf8')) as {
  shapes: Record<string, unknown>
  defaults: Record<string, string>
}

const { FeedMessage } = GtfsRealtimeBindings.transit_realtime
const FEEDS = ['', '-ace', '-bdfm', '-g', '-jz', '-nqrw', '-l', '-si']
let direct = 0
let fallback = 0
let miss = 0
const missSamples: string[] = []

for (const suffix of FEEDS) {
  const res = await fetch(`https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs${suffix}`, {
    signal: AbortSignal.timeout(15000),
  })
  const feed = FeedMessage.toObject(FeedMessage.decode(new Uint8Array(await res.arrayBuffer())), { longs: Number }) as {
    entity: Array<{ tripUpdate?: { trip: { tripId: string; routeId: string } } }>
  }
  for (const e of feed.entity) {
    if (!e.tripUpdate) continue
    const { tripId, routeId } = e.tripUpdate.trip
    const path = tripId.slice(tripId.indexOf('_') + 1) // "089850_1..N03R" → "1..N03R"
    if (net.shapes[path]) {
      direct++
      continue
    }
    const d = path.match(/\.\.?([NS])/)?.[1]
    if (d && net.defaults[`${routeId}|${d}`]) {
      fallback++
      continue
    }
    miss++
    if (missSamples.length < 8) missSamples.push(`${routeId} ${tripId}`)
  }
  await new Promise((r) => setTimeout(r, 250))
}

const total = direct + fallback + miss
console.log(`=== RT→shape 對應抽測（${total} trips）===`)
console.log(`直配 ${direct}（${((direct / total) * 100).toFixed(1)}%）・墊底 ${fallback}（${((fallback / total) * 100).toFixed(1)}%）・落空 ${miss}（${((miss / total) * 100).toFixed(1)}%）`)
if (missSamples.length) console.log('落空樣本:', missSamples.join(' | '))
if ((direct + fallback) / total < 0.9) {
  console.log('❌ 未達 90% 門檻')
  process.exitCode = 1
} else {
  console.log('✅ 達標')
}
