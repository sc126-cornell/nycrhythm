// Sun elevation (simplified NOAA) — drives the automatic NYC day/night theme
// UTC + fixed NYC coordinates: viewers anywhere follow New York's sky
const NYC_LAT = 40.73
const NYC_LON = -73.95
// Below -4° (≈15–20 min after sunset, streetlights-on feel) counts as night
const NIGHT_ELEVATION = -4

export function sunElevationDeg(date: Date, latDeg = NYC_LAT, lonDeg = NYC_LON): number {
  const rad = Math.PI / 180
  const jd = date.getTime() / 86400000 + 2440587.5
  const d = jd - 2451545.0
  const g = (357.529 + 0.98560028 * d) * rad
  const q = 280.459 + 0.98564736 * d
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad
  const e = (23.439 - 0.00000036 * d) * rad
  const RA = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad
  const dec = Math.asin(Math.sin(e) * Math.sin(L))
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24
  const ha = ((((gmst * 15 + lonDeg - RA) % 360) + 540) % 360) - 180
  const lat = latDeg * rad
  const sinEl = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha * rad)
  return Math.asin(sinEl) / rad
}

export const isNycNight = (date = new Date()): boolean => sunElevationDeg(date) < NIGHT_ELEVATION
