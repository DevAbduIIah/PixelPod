import { useEffect } from 'react'
import Screen from './Screen'
import ClickWheel from './ClickWheel'
import { playClickSound, playSelectSound, playBackSound, initAudio } from '../utils/sounds'
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
  isLoading,
  progress,
  currentProgress,
  duration,
  volume,
  shuffleEnabled,
  repeatMode,
  onSeek,
  onToggleShuffle,
  onCycleRepeatMode,
  onVolumeChange,
  playbackError,
  playbackReady,
  searchResults,
  onSearch,
  searchMode,
  userProfile,
  onLogout,
  transitionDirection
}) {
  // Initialize audio on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      initAudio()
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }

    window.addEventListener('click', handleFirstInteraction)
    window.addEventListener('keydown', handleFirstInteraction)

    return () => {
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  // Wrapped handlers with sound effects
  const handleNextWithSound = () => {
    playClickSound()
    onNext()
  }

  const handlePreviousWithSound = () => {
    playClickSound()
    onPrevious()
  }

  const handleSelectWithSound = () => {
    playSelectSound()
    onSelect()
  }

  const handleBackWithSound = () => {
    playBackSound()
    onBack()
  }

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
          handlePreviousWithSound()
          break
        case 'ArrowDown':
          e.preventDefault()
          handleNextWithSound()
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
            handleSelectWithSound()
          }
          break
        case 'Escape':
          e.preventDefault()
          handleBackWithSound()
          break
        case ' ':
          // Don't capture space when typing
          if (!isTyping) {
            e.preventDefault()
            onPlayPause()
          }
          break
        case 's':
        case 'S':
          if (!isTyping && onToggleShuffle) {
            e.preventDefault()
            onToggleShuffle()
          }
          break
        case 'r':
        case 'R':
          if (!isTyping && onCycleRepeatMode) {
            e.preventDefault()
            onCycleRepeatMode()
          }
          break
        case '+':
        case '=':
          if (!isTyping && onVolumeChange && volume !== undefined) {
            e.preventDefault()
            onVolumeChange(Math.min(100, volume + 10))
          }
          break
        case '-':
        case '_':
          if (!isTyping && onVolumeChange && volume !== undefined) {
            e.preventDefault()
            onVolumeChange(Math.max(0, volume - 10))
          }
          break
        case 'm':
        case 'M':
          if (!isTyping && onVolumeChange && volume !== undefined) {
            e.preventDefault()
            // Toggle mute (save previous volume or restore)
            onVolumeChange(volume > 0 ? 0 : 50)
          }
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onPrevious, onNext, onSelect, onBack, onPlayPause, onSkipForward, onSkipBack, onToggleShuffle, onCycleRepeatMode, onVolumeChange, volume])

  return (
    <div className="ipod">
      <div className="ipod-shell">
        <Screen
          currentScreen={currentScreen}
          menuItems={menuItems}
          selectedIndex={selectedIndex}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isLoading={isLoading}
          progress={progress}
          currentProgress={currentProgress}
          duration={duration}
          volume={volume}
          shuffleEnabled={shuffleEnabled}
          repeatMode={repeatMode}
          onSeek={onSeek}
          onToggleShuffle={onToggleShuffle}
          onCycleRepeatMode={onCycleRepeatMode}
          onVolumeChange={onVolumeChange}
          onPlayPause={onPlayPause}
          playbackError={playbackError}
          playbackReady={playbackReady}
          searchResults={searchResults}
          onSearch={onSearch}
          onSelect={onSelect}
          mode={searchMode}
          userProfile={userProfile}
          onLogout={onLogout}
          transitionDirection={transitionDirection}
        />
        <ClickWheel
          onSelect={handleSelectWithSound}
          onBack={handleBackWithSound}
          onNext={handleNextWithSound}
          onPrevious={handlePreviousWithSound}
          onPlayPause={onPlayPause}
          onSkipForward={onSkipForward}
          onSkipBack={onSkipBack}
        />
      </div>
    </div>
  )
}

export default IPod
