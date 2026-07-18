// Station search — substring match on name/id.
// iOS hardening inherited from mrtrhythm: pointerdown picks (early in the tap
// sequence), focus selects old text, cancellable hide timer.
import type { Network, StationInfo } from '../core/types.ts'

export function initSearch(net: Network, onPick: (s: StationInfo) => void): void {
  const input = document.getElementById('searchInput') as HTMLInputElement
  const list = document.getElementById('searchResults')!
  const idx = net.stations.map((s) => ({ s, hay: `${s.name} ${s.id}`.toLowerCase() }))

  let hideTimer = 0
  const hideNow = () => {
    clearTimeout(hideTimer)
    list.classList.add('hidden')
  }

  function render(q: string) {
    const needle = q.trim().toLowerCase()
    if (!needle) {
      hideNow()
      return
    }
    const hits = idx.filter((x) => x.hay.includes(needle)).slice(0, 8)
    list.innerHTML = hits.length
      ? hits.map((h) => `<button class="sr-row" data-id="${h.s.id}"><b>${h.s.name}</b> <small>${h.s.id}</small></button>`).join('')
      : `<div class="sr-none">No station matches “${q}”</div>`
    list.classList.remove('hidden')
  }

  input.addEventListener('input', () => render(input.value))
  input.addEventListener('focus', () => {
    input.select()
    render(input.value)
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = ''
      hideNow()
      input.blur()
    }
    e.stopPropagation()
  })
  input.addEventListener('blur', () => {
    clearTimeout(hideTimer)
    hideTimer = window.setTimeout(() => list.classList.add('hidden'), 250)
  })

  list.addEventListener('pointerdown', (e) => {
    clearTimeout(hideTimer)
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.sr-row')
    if (!btn) return
    e.preventDefault()
    const s = net.stations.find((x) => x.id === btn.dataset.id)
    if (s) {
      onPick(s)
      input.value = s.name
      hideNow()
      input.blur()
    }
  })
}
