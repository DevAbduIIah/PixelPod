// Web Audio API sound generator for iPod-style clicks
// AudioContext is created lazily on first use to avoid browser autoplay warnings
let audioContext = null

const getAudioContext = () => {
  if (!audioContext && typeof window !== 'undefined') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

/**
 * Play a click sound (for scrolling)
 */
export const playClickSound = () => {
  const ctx = getAudioContext()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  // Short, high-pitched click
  oscillator.frequency.value = 800
  oscillator.type = 'square'

  gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.02)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.02)
}

/**
 * Play a select sound (for confirming selection)
 */
export const playSelectSound = () => {
  const ctx = getAudioContext()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  // Two-tone beep for confirmation
  oscillator.frequency.value = 1200
  oscillator.type = 'sine'

  gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

  oscillator.start(ctx.currentTime)
  oscillator.frequency.setValueAtTime(1400, ctx.currentTime + 0.05)
  oscillator.stop(ctx.currentTime + 0.1)
}

/**
 * Play a back sound (for going back)
 */
export const playBackSound = () => {
  const ctx = getAudioContext()
  if (!ctx) return

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  // Lower tone that descends
  oscillator.frequency.value = 900
  oscillator.type = 'sine'

  gainNode.gain.setValueAtTime(0.18, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)

  oscillator.start(ctx.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08)
  oscillator.stop(ctx.currentTime + 0.08)
}

/**
 * Initialize audio context (needed for some browsers)
 */
export const initAudio = () => {
  const ctx = getAudioContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume()
  }
}
