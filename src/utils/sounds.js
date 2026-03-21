// Web Audio API sound generator for iPod-style clicks
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null

/**
 * Play a click sound (for scrolling)
 */
export const playClickSound = () => {
  if (!audioContext) return

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // Short, high-pitched click
  oscillator.frequency.value = 800
  oscillator.type = 'square'

  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.02)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.02)
}

/**
 * Play a select sound (for confirming selection)
 */
export const playSelectSound = () => {
  if (!audioContext) return

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // Two-tone beep for confirmation
  oscillator.frequency.value = 1200
  oscillator.type = 'sine'

  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

  oscillator.start(audioContext.currentTime)
  oscillator.frequency.setValueAtTime(1400, audioContext.currentTime + 0.05)
  oscillator.stop(audioContext.currentTime + 0.1)
}

/**
 * Play a back sound (for going back)
 */
export const playBackSound = () => {
  if (!audioContext) return

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // Lower tone that descends
  oscillator.frequency.value = 900
  oscillator.type = 'sine'

  gainNode.gain.setValueAtTime(0.18, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08)

  oscillator.start(audioContext.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.08)
  oscillator.stop(audioContext.currentTime + 0.08)
}

/**
 * Initialize audio context (needed for some browsers)
 */
export const initAudio = () => {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume()
  }
}
