// T1.3 驗證器：network.json 結構門檻（CI 用，違反即 exit 1）
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const net = JSON.parse(readFileSync(resolve(ROOT, 'web/public/data/network.json'), 'utf8')) as {
  routes: Array<{ id: string; color: string }>
  stations: Array<{ id: string }>
  platToSta: Record<string, string>
  shapes: Record<string, { pts: [number, number][]; chain: number[]; stops: Record<string, number> }>
  defaults: Record<string, string>
  meta: { warnings: string[] }
}

const errors: string[] = []
const ok = (c: boolean, m: string) => {
  if (!c) errors.push(m)
}

ok(net.routes.length === 29, `routes ${net.routes.length} ≠ 29`)
ok(net.stations.length >= 490, `母站 ${net.stations.length} < 490`)
ok(Object.keys(net.shapes).length === 257, `shapes ${Object.keys(net.shapes).length} ≠ 257`)
ok(net.routes.every((r) => /^#[0-9A-Fa-f]{6}$/.test(r.color)), '有路線色票非 #RRGGBB')

const staSet = new Set(net.stations.map((s) => s.id))
const orphan = Object.values(net.platToSta).filter((p) => !staSet.has(p)).length
ok(orphan === 0, `${orphan} 個月台的母站不存在`)

let badChain = 0
let badKm = 0
let emptyStops = 0
for (const [id, s] of Object.entries(net.shapes)) {
  ok(s.pts.length === s.chain.length, `${id} pts/chain 長度不符`)
  for (let i = 1; i < s.chain.length; i++)
    if (s.chain[i] < s.chain[i - 1]) {
      badChain++
      break
    }
  const kms = Object.values(s.stops)
  if (!kms.length) emptyStops++
  const sorted = [...kms].sort((a, b) => a - b)
  if (kms.some((v, i) => v !== sorted[i])) badKm++ // stops 物件插入序＝停靠序
}
ok(badChain === 0, `${badChain} 個 shape chain 非遞增`)
ok(badKm === 0, `${badKm} 個 shape stopKm 非單調`)
ok(emptyStops === 0, `${emptyStops} 個 shape 無停靠投影`)

// defaults：trips 出現過的每條 route 雙向皆有底
const routeIds = new Set(net.routes.map((r) => r.id))
const missing = [...routeIds].flatMap((r) => (['N', 'S'] as const).map((d) => `${r}|${d}`)).filter((k) => !net.defaults[k])
ok(missing.length === 0, `defaults 缺: ${missing.join(', ') || '無'}`)

console.log('=== validate-network ===')
if (errors.length) {
  for (const e of errors) console.log('❌ ' + e)
  process.exitCode = 1
} else {
  console.log(`✅ 全數通過（routes 29／母站 ${net.stations.length}／shapes 257／defaults ${Object.keys(net.defaults).length}／警告 ${net.meta.warnings.length}）`)
}
