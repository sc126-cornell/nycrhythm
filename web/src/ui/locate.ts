// "My location" — geolocation toggle button: blue dot + accuracy ring.
// No auto-request: the iOS permission prompt must come from an explicit tap.
// Centers the map once per activation; later fixes just move the dot so the
// camera is never stolen mid-browse (train follow drops to 'free' via onCenter).
import * as L from 'leaflet'

const NYC: [number, number] = [40.73, -73.97]
const kmFromNyc = (lat: number, lon: number): number => {
  const rad = Math.PI / 180
  const x = (lon - NYC[1]) * rad * Math.cos(((lat + NYC[0]) / 2) * rad)
  const y = (lat - NYC[0]) * rad
  return Math.hypot(x, y) * 6371
}

export function initLocate(map: L.Map, onCenter: () => void) {
  const btn = document.getElementById('locateBtn') as HTMLButtonElement
  let watchId: number | null = null
  let dot: L.CircleMarker | null = null
  let ring: L.Circle | null = null
  let centered = false
  let warned = false

  function toast(msg: string) {
    const el = document.createElement('div')
    el.className = 'toast'
    el.textContent = msg
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2600)
  }

  function stop() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    watchId = null
    dot?.remove()
    ring?.remove()
    dot = null
    ring = null
    centered = false
    warned = false
    btn.classList.remove('active')
  }

  btn.addEventListener('click', () => {
    if (watchId !== null) {
      stop()
      return
    }
    if (!navigator.geolocation) {
      toast('Location is not supported by this browser')
      return
    }
    btn.classList.add('active')
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon, accuracy } = pos.coords
        if (!dot) {
          ring = L.circle([lat, lon], {
            radius: accuracy,
            color: '#1a73e8',
            weight: 1,
            opacity: 0.35,
            fillColor: '#1a73e8',
            fillOpacity: 0.08,
            interactive: false,
          }).addTo(map)
          dot = L.circleMarker([lat, lon], {
            radius: 7,
            color: '#ffffff',
            weight: 2.5,
            fillColor: '#1a73e8',
            fillOpacity: 1,
            interactive: false,
          }).addTo(map)
        } else {
          dot.setLatLng([lat, lon])
          ring!.setLatLng([lat, lon])
          ring!.setRadius(accuracy)
        }
        if (!centered) {
          centered = true
          if (kmFromNyc(lat, lon) <= 80) {
            onCenter()
            map.setView([lat, lon], Math.max(map.getZoom(), 15))
          } else {
            toast('You appear to be outside NYC — dot shown, map not moved')
          }
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          stop()
          toast('Location permission denied')
        } else if (!warned) {
          // underground the first fix can be slow or absent — keep watching
          warned = true
          toast('Waiting for a GPS fix…')
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
  })
}
