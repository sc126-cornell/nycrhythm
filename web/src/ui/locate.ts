// "My location" — blue dot + accuracy ring + heading beam (Google-maps style).
// Auto-starts on load (user decision 2026-07-19): the browser location prompt is
// the consent surface; errors/out-of-NYC stay silent in auto mode so a denied
// visitor is never nagged. iOS compass permission legally needs a tap, so the
// beam binds on the first touch anywhere (silent if previously granted).
// Centers once per activation; a deep-linked view suppresses auto (caller decides).
// Heading: iOS webkitCompassHeading > Android absolute alpha > GPS course walking.
import * as L from 'leaflet'

const NYC: [number, number] = [40.73, -73.97]
const kmFromNyc = (lat: number, lon: number): number => {
  const rad = Math.PI / 180
  const x = (lon - NYC[1]) * rad * Math.cos(((lat + NYC[0]) / 2) * rad)
  const y = (lat - NYC[0]) * rad
  return Math.hypot(x, y) * 6371
}

type CompassEvent = DeviceOrientationEvent & { webkitCompassHeading?: number }

// stored as a plain boolean: an inline `in window` guard narrows `window` to never
const hasAbsoluteOrientation = 'ondeviceorientationabsolute' in window

export function initLocate(map: L.Map, onCenter: () => void, auto = false) {
  const btn = document.getElementById('locateBtn') as HTMLButtonElement
  let watchId: number | null = null
  let marker: L.Marker | null = null
  let ring: L.Circle | null = null
  let beamEl: HTMLElement | null = null
  let centered = false
  let warned = false
  let compass = false // a compass source is delivering headings
  let shownDeg = 0 // unwrapped rotation so the CSS transition never spins the long way
  let beamOn = false
  let boundEvent: 'deviceorientation' | 'deviceorientationabsolute' | null = null
  let retryPending = false

  function toast(msg: string) {
    const el = document.createElement('div')
    el.className = 'toast'
    el.textContent = msg
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2600)
  }

  function applyHeading(h: number) {
    if (!beamEl) return
    const delta = ((((h - shownDeg) % 360) + 540) % 360) - 180
    if (beamOn && Math.abs(delta) < 2) return
    shownDeg += delta
    beamEl.style.transform = `rotate(${shownDeg}deg)`
    if (!beamOn) {
      beamOn = true
      beamEl.style.opacity = '1'
    }
  }

  const onOrient = (e: CompassEvent) => {
    let h: number | null = null
    if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
      // iOS: CW from north relative to the device top — adjust for screen rotation
      h = e.webkitCompassHeading + (screen.orientation?.angle ?? 0)
    } else if (e.absolute && e.alpha !== null) {
      h = 360 - e.alpha + (screen.orientation?.angle ?? 0)
    }
    if (h === null) return
    compass = true
    applyHeading(((h % 360) + 360) % 360)
  }

  const retryBind = () => {
    retryPending = false
    if (watchId !== null && !boundEvent) bindOrientation(false)
  }

  function bindOrientation(deferToGesture: boolean) {
    // iOS 13+ gates the compass behind a permission that needs a tap gesture
    const doe = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
    if (typeof doe.requestPermission === 'function') {
      doe
        .requestPermission()
        .then((r) => {
          if (r === 'granted') {
            boundEvent = 'deviceorientation'
            window.addEventListener('deviceorientation', onOrient)
          }
        })
        .catch(() => {
          if (deferToGesture && !retryPending) {
            retryPending = true
            window.addEventListener('pointerdown', retryBind, { once: true })
          }
        })
    } else if (hasAbsoluteOrientation) {
      boundEvent = 'deviceorientationabsolute'
      window.addEventListener('deviceorientationabsolute', onOrient as EventListener)
    } else {
      boundEvent = 'deviceorientation'
      window.addEventListener('deviceorientation', onOrient)
    }
  }

  function stop() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    watchId = null
    if (boundEvent) window.removeEventListener(boundEvent, onOrient as EventListener)
    boundEvent = null
    window.removeEventListener('pointerdown', retryBind)
    retryPending = false
    marker?.remove()
    ring?.remove()
    marker = null
    ring = null
    beamEl = null
    centered = false
    warned = false
    compass = false
    beamOn = false
    shownDeg = 0
    btn.classList.remove('active')
  }

  function start(silent: boolean) {
    if (!navigator.geolocation) {
      if (!silent) toast('Location is not supported by this browser')
      return
    }
    btn.classList.add('active')
    bindOrientation(silent)
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon, accuracy, heading, speed } = pos.coords
        if (!marker) {
          ring = L.circle([lat, lon], {
            radius: accuracy,
            color: '#1a73e8',
            weight: 1,
            opacity: 0.35,
            fillColor: '#1a73e8',
            fillOpacity: 0.08,
            interactive: false,
          }).addTo(map)
          marker = L.marker([lat, lon], {
            icon: L.divIcon({ className: 'me-icon', html: '<div class="me-beam"></div><div class="me-dot"></div>', iconSize: [0, 0] }),
            interactive: false,
            keyboard: false,
          }).addTo(map)
          beamEl = marker.getElement()?.querySelector('.me-beam') ?? null
        } else {
          marker.setLatLng([lat, lon])
          ring!.setLatLng([lat, lon])
          ring!.setRadius(accuracy)
        }
        // no compass (denied / unsupported): fall back to GPS course while walking
        if (!compass && heading !== null && !Number.isNaN(heading) && (speed ?? 0) > 0.5) {
          applyHeading(heading)
        }
        if (!centered) {
          centered = true
          if (kmFromNyc(lat, lon) <= 80) {
            onCenter()
            map.setView([lat, lon], Math.max(map.getZoom(), 15))
          } else if (!silent) {
            toast('You appear to be outside NYC — dot shown, map not moved')
          }
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          stop()
          if (!silent) toast('Location permission denied')
        } else if (!warned && !silent) {
          // underground the first fix can be slow or absent — keep watching
          warned = true
          toast('Waiting for a GPS fix…')
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
  }

  btn.addEventListener('click', () => {
    if (watchId !== null) stop()
    else start(false)
  })
  if (auto) start(true)
}
