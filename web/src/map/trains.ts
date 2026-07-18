// Canvas train layer — NYC bullet style (colored circle + route letter),
// single-pass redraw per frame + screen-space hit test.
// iOS rule inherited from mrtrhythm: never rebuild clickable DOM per frame — this
// layer is pointer-events:none canvas; clicks come via map events + hitTest.
import type * as L from 'leaflet'
import type { TrainState } from '../core/position.ts'
import type { Pt } from '../core/types.ts'

export interface DrawItem {
  st: TrainState
  color: string
  letter: string
  selected: boolean
}

export interface StationLabel {
  lonlat: Pt
  name: string
}

// yellow/gray bullets need dark glyphs
const darkText = (hex: string): boolean => {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 160
}

export class TrainsLayer {
  private readonly map: L.Map
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private hits: Array<{ x: number; y: number; st: TrainState }> = []

  constructor(map: L.Map) {
    this.map = map
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'trains-canvas'
    map.getContainer().appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')!
    this.resize()
    map.on('resize', () => this.resize())
  }

  private resize() {
    const size = this.map.getSize()
    const dpr = devicePixelRatio || 1
    this.canvas.width = size.x * dpr
    this.canvas.height = size.y * dpr
    this.canvas.style.width = `${size.x}px`
    this.canvas.style.height = `${size.y}px`
  }

  draw(items: DrawItem[], labels: StationLabel[] = [], dark = false) {
    const dpr = devicePixelRatio || 1
    const ctx = this.ctx
    const size = this.map.getSize()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size.x, size.y)
    const zoom = this.map.getZoom()
    this.hits = []

    // our own crisp station labels (under trains)
    if (zoom >= 13 && labels.length) {
      const fs = zoom >= 15 ? 12 : 11
      ctx.font = `${fs}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      ctx.strokeStyle = dark ? 'rgba(12, 14, 18, 0.9)' : 'rgba(255, 255, 255, 0.9)'
      ctx.fillStyle = dark ? '#e6e6e2' : '#26282c'
      for (const lb of labels) {
        const p = this.map.latLngToContainerPoint([lb.lonlat[1], lb.lonlat[0]])
        if (p.x < -80 || p.y < -30 || p.x > size.x + 80 || p.y > size.y + 30) continue
        ctx.strokeText(lb.name, p.x, p.y + 7)
        ctx.fillText(lb.name, p.x, p.y + 7)
      }
    }

    const r = zoom < 12 ? 4.5 : zoom < 14 ? 7 : 9
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const it of items) {
      const p = this.map.latLngToContainerPoint([it.st.lonlat[1], it.st.lonlat[0]])
      if (p.x < -30 || p.y < -30 || p.x > size.x + 30 || p.y > size.y + 30) continue
      this.hits.push({ x: p.x, y: p.y, st: it.st })

      ctx.beginPath()
      ctx.arc(p.x, p.y, it.selected ? r + 2 : r, 0, Math.PI * 2)
      ctx.fillStyle = it.color
      ctx.fill()
      ctx.lineWidth = it.selected ? 2.5 : 1
      ctx.strokeStyle = dark ? '#0d0f13' : '#ffffff'
      ctx.stroke()
      if (zoom >= 12) {
        ctx.fillStyle = darkText(it.color) ? '#111' : '#fff'
        ctx.font = `700 ${Math.round(r * 1.15)}px system-ui, sans-serif`
        ctx.fillText(it.letter, p.x, p.y + 0.5)
      }
    }
  }

  hitTest(x: number, y: number): TrainState | null {
    let best: TrainState | null = null
    let bestD = 16
    for (const h of this.hits) {
      const d = Math.hypot(h.x - x, h.y - y)
      if (d < bestD) {
        bestD = d
        best = h.st
      }
    }
    return best
  }
}
