// T0.3 GTFS 靜態 Spike：下載官方 zip，盤點 routes/stops/shapes/trips/stop_times/transfers
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import AdmZip from 'adm-zip'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RAW = resolve(ROOT, 'pipeline/raw')
const SAMPLES = resolve(ROOT, 'pipeline/samples')
mkdirSync(RAW, { recursive: true })
mkdirSync(SAMPLES, { recursive: true })

const zipPath = resolve(RAW, 'gtfs_subway.zip')
if (!existsSync(zipPath)) {
  console.log('下載 GTFS 靜態包…')
  const res = await fetch('https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip', { signal: AbortSignal.timeout(120000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()))
}
const zip = new AdmZip(zipPath)

const csv = (name: string): string[][] => {
  const entry = zip.getEntry(name)
  if (!entry) return []
  // GTFS 欄位無引號逗號的簡化解析（NYCT 檔案實務上安全；正式管線再嚴謹化）
  return entry
    .getData()
    .toString('utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => l.split(','))
}

console.log('=== zip 內容 ===')
for (const e of zip.getEntries()) console.log(`  ${e.entryName.padEnd(20)} ${(e.header.size / 1024).toFixed(0)} KB`)

// routes：色票是前端調色盤的直接來源
const routes = csv('routes.txt')
const rh = routes[0]
const idx = (h: string[], k: string) => h.indexOf(k)
const routeRows = routes.slice(1).map((r) => ({
  id: r[idx(rh, 'route_id')],
  short: r[idx(rh, 'route_short_name')],
  long: r[idx(rh, 'route_long_name')],
  color: r[idx(rh, 'route_color')],
}))
console.log(`\n=== routes：${routeRows.length} 條 ===`)
for (const r of routeRows) console.log(`  ${String(r.id).padEnd(4)} #${r.color || '——————'} ${r.long}`)
writeFileSync(resolve(SAMPLES, 'routes.sample.json'), JSON.stringify(routeRows, null, 2))

// stops：location_type=1 為母站，其餘為月台（N/S 尾碼＝方向）
const stops = csv('stops.txt')
const sh = stops[0]
const stations = stops.slice(1).filter((s) => s[idx(sh, 'location_type')] === '1')
const platforms = stops.slice(1).filter((s) => s[idx(sh, 'location_type')] !== '1')
console.log(`\n=== stops：母站 ${stations.length}・月台 ${platforms.length} ===`)
console.log('  月台例:', stops.slice(1, 4).map((s) => s[idx(sh, 'stop_id')]).join(', '))
writeFileSync(
  resolve(SAMPLES, 'stops.sample.json'),
  JSON.stringify({ stationCount: stations.length, platformCount: platforms.length, head: stops.slice(0, 6) }, null, 2),
)

// shapes：變體數（快車/慢車/分岔）
const shapes = csv('shapes.txt')
const shIdx = shapes[0].indexOf('shape_id')
const shapeIds = new Set(shapes.slice(1).map((s) => s[shIdx]))
console.log(`\n=== shapes：${shapeIds.size} 個變體・${shapes.length - 1} 點 ===`)
console.log('  例:', [...shapeIds].slice(0, 8).join(', '))

// trips
const trips = csv('trips.txt')
const th = trips[0]
const svcIds = new Set(trips.slice(1).map((t) => t[idx(th, 'service_id')]))
console.log(`\n=== trips：${trips.length - 1} 班・service_id ${[...svcIds].join(' / ')} ===`)

// stop_times：只量規模
const stEntry = zip.getEntry('stop_times.txt')
if (stEntry) {
  const data = stEntry.getData()
  let lines = 0
  for (const b of data) if (b === 10) lines++
  console.log(`\n=== stop_times：${(data.length / 1048576).toFixed(1)} MB・${lines.toLocaleString()} 行 ===`)
}

// transfers：站群/轉乘
const transfers = csv('transfers.txt')
console.log(`\n=== transfers：${Math.max(0, transfers.length - 1)} 條 ===`)
if (transfers.length > 1) console.log('  欄位:', transfers[0].join(','))
