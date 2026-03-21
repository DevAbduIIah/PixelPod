import { useEffect } from 'react'

export function useKeyboardNavigation({
  onNext,
  onPrevious,
  onSelect,
  onBack,
  onPlayPause,
  onSkipForward,
  onSkipBack,
  onToggleShuffle,
  onCycleRepeatMode,
  onVolumeChange,
  volume
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const isTyping = document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'

      if (isTyping && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        return
      }

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          onPrevious?.()
          break
        case 'ArrowDown':
          event.preventDefault()
          onNext?.()
          break
        case 'ArrowLeft':
          event.preventDefault()
          onSkipBack?.()
          break
        case 'ArrowRight':
          event.preventDefault()
          onSkipForward?.()
          break
        case 'Enter':
          if (!isTyping) {
            event.preventDefault()
            onSelect?.()
          }
          break
        case 'Escape':
          event.preventDefault()
          onBack?.()
          break
        case ' ':
          if (!isTyping) {
            event.preventDefault()
            onPlayPause?.()
          }
          break
        case 's':
        case 'S':
          if (!isTyping) {
            event.preventDefault()
            onToggleShuffle?.()
          }
          break
        case 'r':
        case 'R':
          if (!isTyping) {
            event.preventDefault()
            onCycleRepeatMode?.()
          }
          break
        case '+':
        case '=':
          if (!isTyping && onVolumeChange && volume !== undefined) {
            event.preventDefault()
            onVolumeChange(Math.min(100, volume + 10))
          }
          break
        case '-':
        case '_':
          if (!isTyping && onVolumeChange && volume !== undefined) {
            event.preventDefault()
            onVolumeChange(Math.max(0, volume - 10))
          }
          break
        case 'm':
        case 'M':
          if (!isTyping && onVolumeChange && volume !== undefined) {
            event.preventDefault()
            onVolumeChange(volume > 0 ? 0 : 50)
          }
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    onNext,
    onPrevious,
    onSelect,
    onBack,
    onPlayPause,
    onSkipForward,
    onSkipBack,
    onToggleShuffle,
    onCycleRepeatMode,
    onVolumeChange,
    volume
  ])
}

