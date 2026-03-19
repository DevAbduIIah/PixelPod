import { useEffect } from 'react'
import Screen from './Screen'
import ClickWheel from './ClickWheel'
import './IPod.css'

function IPod({
  currentScreen,
  menuItems,
  selectedIndex,
  onSelect,
  onBack,
  onNext,
  onPrevious,
  onPlayPause,
  onSkipForward,
  onSkipBack,
  currentTrack,
  isPlaying,
  progress,
  searchResults,
  onSearch,
  searchMode
}) {
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture horizontal arrow keys when user is typing in an input
      // This allows cursor movement within text inputs
      const isTyping = document.activeElement?.tagName === 'INPUT' ||
                       document.activeElement?.tagName === 'TEXTAREA'

      if (isTyping && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        return // Let the input handle horizontal arrows
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          onPrevious()
          break
        case 'ArrowDown':
          e.preventDefault()
          onNext()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onSkipBack()
          break
        case 'ArrowRight':
          e.preventDefault()
          onSkipForward()
          break
        case 'Enter':
          // Don't prevent default for Enter when typing - let search submit work
          if (!isTyping) {
            e.preventDefault()
            onSelect()
          }
          break
        case 'Escape':
          e.preventDefault()
          onBack()
          break
        case ' ':
          // Don't capture space when typing
          if (!isTyping) {
            e.preventDefault()
            onPlayPause()
          }
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onPrevious, onNext, onSelect, onBack, onPlayPause, onSkipForward, onSkipBack])

  return (
    <div className="ipod">
      <div className="ipod-shell">
        <Screen
          currentScreen={currentScreen}
          menuItems={menuItems}
          selectedIndex={selectedIndex}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          progress={progress}
          searchResults={searchResults}
          onSearch={onSearch}
          mode={searchMode}
        />
        <ClickWheel
          onSelect={onSelect}
          onBack={onBack}
          onNext={onNext}
          onPrevious={onPrevious}
          onPlayPause={onPlayPause}
          onSkipForward={onSkipForward}
          onSkipBack={onSkipBack}
        />
      </div>
    </div>
  )
}

export default IPod
