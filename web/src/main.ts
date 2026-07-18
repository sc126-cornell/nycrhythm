import './style.css'

// Build stamp: bump letter per deploy, shown on screen and console
export const BUILD = 'M1a-20260719'

const status = document.getElementById('status')!
status.textContent = `BUILD ${BUILD}`
console.info(`nycrhythm BUILD ${BUILD}`)

// /api/health smoke test — no functions in local dev, failure is expected there
fetch('/api/health')
  .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
  .then((d: { ok: boolean }) => {
    status.textContent = `BUILD ${BUILD} · API ${d.ok ? 'connected' : 'error'}`
  })
  .catch(() => {
    status.textContent = `BUILD ${BUILD} · API offline (expected in local dev)`
  })
