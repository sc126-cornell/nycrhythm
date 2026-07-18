// URL deep links via location.hash (replaceState — no history spam)
// c=lat,lng z=zoom f=tripId (follow) s=stationId (board)
// Writes are throttled (≤1/s with trailing flush): follow-mode panTo fires moveend
// every frame and pure debounce would starve (mrtrhythm lesson).
export interface DeepLinkState {
  c?: [number, number]
  z?: number
  f?: string
  s?: string
}

export function parseHash(): DeepLinkState {
  const out: DeepLinkState = {}
  const h = new URLSearchParams(location.hash.replace(/^#/, ''))
  const c = h.get('c')?.split(',').map(Number)
  if (c?.length === 2 && c.every(Number.isFinite)) out.c = [c[0], c[1]]
  const z = Number(h.get('z'))
  if (Number.isFinite(z) && z >= 9 && z <= 19) out.z = z
  const f = h.get('f')
  if (f && /^[\w.]+$/.test(f)) out.f = f
  const s = h.get('s')
  if (s && /^[\w]+$/.test(s)) out.s = s
  return out
}

let timer = 0
let lastWrite = 0

export function writeHash(st: DeepLinkState): void {
  const write = () => {
    lastWrite = Date.now()
    const h = new URLSearchParams()
    if (st.c) h.set('c', `${st.c[0].toFixed(5)},${st.c[1].toFixed(5)}`)
    if (st.z !== undefined) h.set('z', String(st.z))
    if (st.f) h.set('f', st.f)
    if (st.s) h.set('s', st.s)
    history.replaceState(null, '', `#${h.toString()}`)
  }
  clearTimeout(timer)
  if (Date.now() - lastWrite > 1000) write()
  else timer = window.setTimeout(write, 400)
}
