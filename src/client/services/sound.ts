const STORAGE_KEY = "role-room:muted"

export type SoundName = "click" | "transition" | "reveal-flip" | "reveal-burst" | "mute-toggle"

const SOURCES: Record<SoundName, string> = {
  "click":         "/sounds/click.ogg",
  "transition":    "/sounds/transition.ogg",
  "reveal-flip":   "/sounds/reveal-flip.ogg",
  "reveal-burst":  "/sounds/reveal-burst.ogg",
  "mute-toggle":   "/sounds/mute-toggle.ogg"
}

const buffers = new Map<SoundName, AudioBuffer>()
let ctx: AudioContext | null = null
let muted = true

export function init(): void {
  const stored = localStorage.getItem(STORAGE_KEY)
  muted = stored === null ? true : stored === "1"
}

export function isMuted(): boolean { return muted }

export function setMuted(value: boolean): void {
  muted = value
  localStorage.setItem(STORAGE_KEY, value ? "1" : "0")
}

async function ensureCtx(): Promise<AudioContext | null> {
  if (ctx) return ctx
  if (typeof window === "undefined" || !("AudioContext" in window)) return null
  ctx = new AudioContext()
  return ctx
}

async function loadBuffer(name: SoundName): Promise<AudioBuffer | null> {
  if (buffers.has(name)) return buffers.get(name)!
  const c = await ensureCtx()
  if (!c) return null
  try {
    const res = await fetch(SOURCES[name])
    if (!res.ok) return null
    const data = await res.arrayBuffer()
    const buf = await c.decodeAudioData(data)
    buffers.set(name, buf)
    return buf
  } catch {
    return null
  }
}

export async function play(name: SoundName, volume = 1): Promise<void> {
  if (muted) return
  const c = await ensureCtx()
  if (!c) return
  if (c.state === "suspended") await c.resume()
  const buf = await loadBuffer(name)
  if (!buf) return
  const src = c.createBufferSource()
  const gain = c.createGain()
  gain.gain.value = volume
  src.buffer = buf
  src.connect(gain).connect(c.destination)
  src.start(0)
}
