let audioCtx = null
let clickBuffer = null  // decoded PCM buffer for the custom click sound

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

/** Load click.m4a once and cache the decoded buffer */
async function loadClickBuffer() {
  if (clickBuffer) return clickBuffer
  try {
    const ctx = getCtx()
    const res = await fetch('/click.m4a')
    const raw = await res.arrayBuffer()
    clickBuffer = await ctx.decodeAudioData(raw)
  } catch {
    // fall back to synth if file unavailable
  }
  return clickBuffer
}

// Pre-load on first import (non-blocking)
loadClickBuffer()

export function playClick() {
  try {
    const ctx = getCtx()
    if (clickBuffer) {
      const source = ctx.createBufferSource()
      source.buffer = clickBuffer
      // Slight gain to keep volume consistent
      const gain = ctx.createGain()
      gain.gain.value = 0.85
      source.connect(gain)
      gain.connect(ctx.destination)
      source.start()
    } else {
      // Synth fallback while file loads or if unavailable
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.04)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.06)
    }
  } catch {
    // silently fail if audio not available
  }
}

export function playCheck() {
  try {
    const ctx = getCtx()
    ;[523, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.08
      gain.gain.setValueAtTime(0.1, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
      osc.start(t)
      osc.stop(t + 0.15)
    })
  } catch {}
}

export function playSuccess() {
  try {
    const ctx = getCtx()
    ;[523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'square'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.12
      gain.gain.setValueAtTime(0.1, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
      osc.start(t)
      osc.stop(t + 0.22)
    })
  } catch {}
}

export function playBreakChime() {
  try {
    const ctx = getCtx()
    ;[880, 660, 523].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.22
      gain.gain.setValueAtTime(0.18, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
      osc.start(t)
      osc.stop(t + 0.4)
    })
  } catch {}
}
