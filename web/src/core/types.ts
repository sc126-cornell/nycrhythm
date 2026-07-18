// Data contracts (produced by pipeline / api — see SPIKE-NOTES §5)
export type Pt = [number, number] // [lon, lat]

export interface RouteInfo {
  id: string
  name: string
  color: string
}

export interface StationInfo {
  id: string
  name: string
  lonlat: Pt
  cx?: string
}

export interface ShapeData {
  pts: Pt[]
  chain: number[]
  stops: Record<string, number> // platformId → meters along shape
}

export interface Network {
  version: string
  generatedAt: string
  meta: { warnings: string[] }
  routes: RouteInfo[]
  stations: StationInfo[]
  platToSta: Record<string, string>
  shapes: Record<string, ShapeData>
  shapeRoute: Record<string, string>
  defaults: Record<string, string> // "route|N" → shapeId
}

export interface RtStop {
  s: string // platform id, e.g. "101N"
  a: number // predicted arrival, unix seconds
}

export interface LiveTrip {
  id: string
  route: string
  stops: RtStop[]
  seenAt: number // ms — for stale cleanup
  prev: { s: string; at: number } | null // last departed stop (observed via first-stop change)
  firstSeen: number // ms
}
