import { $ } from "./dom.js"

let timer: number | undefined

export function showToast(message: string, ms = 2500): void {
  const el = $<HTMLDivElement>("#toast")
  el.textContent = message
  el.classList.remove("hidden")
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(() => el.classList.add("hidden"), ms)
}
