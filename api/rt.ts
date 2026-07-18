// GET /api/rt?feed=irt|ace|bdfm|g|jz|nqrw|l|si —— MTA GTFS-RT 解碼＋瘦身代理
// 邊緣快取 15s：使用者數與 MTA 呼叫脫鉤（承 mrtrhythm 模式）
import GtfsRealtimeBindings from 'gtfs-realtime-bindings'

interface Req {
  query?: Record<string, string | string[] | undefined>
}
interface Res {
  setHeader(k: string, v: string): void
  status(code: number): { json(body: unknown): void }
}

const BASE = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs'
const SUFFIX: Record<string, string> = {
  irt: '',
  ace: '-ace',
  bdfm: '-bdfm',
  g: '-g',
  jz: '-jz',
  nqrw: '-nqrw',
  l: '-l',
  si: '-si',
}

const { FeedMessage } = GtfsRealtimeBindings.transit_realtime

export default async function handler(req: Req, res: Res) {
  const feedKey = String(Array.isArray(req.query?.feed) ? req.query?.feed[0] : (req.query?.feed ?? ''))
  const suffix = SUFFIX[feedKey]
  if (suffix === undefined) {
    res.setHeader('Cache-Control', 's-maxage=86400')
    res.status(400).json({ ok: false, error: 'unknown feed' })
    return
  }
  try {
    const r = await fetch(`${BASE}${suffix}`, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) {
      res.setHeader('Cache-Control', 's-maxage=10')
      res.status(502).json({ ok: false })
      return
    }
    const feed = FeedMessage.decode(new Uint8Array(await r.arrayBuffer()))
    const obj = FeedMessage.toObject(feed, { longs: Number }) as {
      header: { timestamp: number }
      entity: Array<{
        tripUpdate?: {
          trip: { tripId: string; routeId: string }
          stopTimeUpdate?: Array<{ stopId?: string; arrival?: { time?: number }; departure?: { time?: number } }>
        }
        vehicle?: { trip?: { tripId?: string }; stopId?: string; currentStatus?: number; timestamp?: number }
      }>
    }
    const now = Math.floor(Date.now() / 1000)
    const trips = obj.entity
      .filter((e) => e.tripUpdate?.stopTimeUpdate?.length)
      .map((e) => ({
        t: e.tripUpdate!.trip.tripId,
        r: e.tripUpdate!.trip.routeId,
        u: e.tripUpdate!.stopTimeUpdate!.filter((s) => s.stopId && ((s.arrival?.time ?? s.departure?.time ?? 0) > now - 90))
          .slice(0, 16)
          .map((s) => ({ s: s.stopId!, a: s.arrival?.time ?? s.departure?.time ?? 0 })),
      }))
      .filter((t) => t.u.length)
    const vehicles = obj.entity
      .filter((e) => e.vehicle?.trip?.tripId)
      .map((e) => ({ t: e.vehicle!.trip!.tripId!, s: e.vehicle!.stopId ?? '', st: e.vehicle!.currentStatus ?? -1, ts: e.vehicle!.timestamp ?? 0 }))
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30')
    res.status(200).json({ ok: true, at: obj.header.timestamp, trips, vehicles })
  } catch {
    res.setHeader('Cache-Control', 's-maxage=10')
    res.status(504).json({ ok: false })
  }
}
