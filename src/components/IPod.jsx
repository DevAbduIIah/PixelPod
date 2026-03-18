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
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          onPrevious()
          break
        case 'ArrowDown':
          e.preventDefault()
          onNext()
          break
        case 'Enter':
          e.preventDefault()
          onSelect()
          break
        case 'Escape':
          e.preventDefault()
          onBack()
          break
        case ' ':
          e.preventDefault()
          onPlayPause()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onPrevious, onNext, onSelect, onBack, onPlayPause])

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
        />
      </div>
    </div>
  )
}

export default IPod
