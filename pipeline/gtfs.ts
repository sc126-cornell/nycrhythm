// GTFS 讀取助手：RFC 4180 CSV（引號/雙引號跳脫/欄內逗號）＋ zip 存取
// Spike 教訓：naive split(',') 會被 route_long_name 的引號逗號打爆
import AdmZip from 'adm-zip'

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field.endsWith('\r') ? field.slice(0, -1) : field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field.length || row.length) {
    row.push(field.endsWith('\r') ? field.slice(0, -1) : field)
    rows.push(row)
  }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''))
}

export class Gtfs {
  private zip: AdmZip
  constructor(zipPath: string) {
    this.zip = new AdmZip(zipPath)
  }
  text(name: string): string {
    const e = this.zip.getEntry(name)
    if (!e) throw new Error(`GTFS 缺 ${name}`)
    return e.getData().toString('utf8')
  }
  /** 完整 CSV 解析 → [{col:val}] */
  records(name: string): Array<Record<string, string>> {
    const rows = parseCsv(this.text(name))
    const header = rows[0]
    return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
  }
  /** 快速逐行（無引號欄位的大檔用，如 stop_times）：cb 回傳 false 可提前中止 */
  eachLineFast(name: string, cb: (fields: string[], header: string[]) => void): void {
    const text = this.text(name)
    let start = text.indexOf('\n') + 1
    const header = text.slice(0, start - 1).replace(/\r$/, '').split(',')
    while (start < text.length) {
      let end = text.indexOf('\n', start)
      if (end === -1) end = text.length
      const line = text.slice(start, end).replace(/\r$/, '')
      if (line) cb(line.split(','), header)
      start = end + 1
    }
  }
}

// ---- 幾何（承 mrtrhythm）----
export type Pt = [number, number] // [lon, lat]
const EARTH = 6371000
const rad = (d: number) => (d * Math.PI) / 180

export function dist(a: Pt, b: Pt): number {
  const x = rad(b[0] - a[0]) * Math.cos(rad((a[1] + b[1]) / 2))
  const y = rad(b[1] - a[1])
  return Math.hypot(x, y) * EARTH
}

export function cumLen(pts: Pt[]): number[] {
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]))
  return cum
}

export function project(p: Pt, pts: Pt[], cum: number[]): { m: number; off: number } {
  let best = { m: 0, off: Infinity }
  const ky = EARTH * (Math.PI / 180)
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const kx = ky * Math.cos(rad((a[1] + b[1]) / 2))
    const ax = (p[0] - a[0]) * kx
    const ay = (p[1] - a[1]) * ky
    const bx = (b[0] - a[0]) * kx
    const by = (b[1] - a[1]) * ky
    const len2 = bx * bx + by * by
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (ax * bx + ay * by) / len2))
    const dx = ax - t * bx
    const dy = ay - t * by
    const off = Math.hypot(dx, dy)
    if (off < best.off) best = { m: cum[i - 1] + t * (cum[i] - cum[i - 1]), off }
  }
  return best
}
