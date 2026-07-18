// Appearance: always follows NYC sunrise/sunset automatically (no manual toggle —
// same product decision as mrtrhythm). Re-evaluated every minute and on tab wake.
import { isNycNight } from '../core/solar.ts'

export function initTheme(onApply: (dark: boolean) => void): void {
  let last: boolean | null = null

  const apply = () => {
    const dark = isNycNight()
    if (dark === last) return
    last = dark
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    onApply(dark)
  }

  setInterval(apply, 60_000)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) apply()
  })
  apply()
}
