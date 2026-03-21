import { useState, useEffect } from 'react'
import BootScreen from '../screens/BootScreen'
import MenuScreen from '../screens/MenuScreen'
import NowPlayingScreen from '../screens/NowPlayingScreen'
import LoginScreen from '../screens/LoginScreen'
import SearchScreen from '../screens/SearchScreen'
import SettingsScreen from '../screens/SettingsScreen'
import './Screen.css'

function Screen({
  currentScreen,
  menuItems,
  selectedIndex,
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
  onPlayPause,
  playbackError,
  playbackReady,
  searchQuery,
  searchResults,
  onSearch,
  onSelect,
  mode,
  userProfile,
  onLogout,
  transitionDirection
}) {
  const [displayScreen, setDisplayScreen] = useState(currentScreen)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Handle screen transitions
  useEffect(() => {
    if (currentScreen !== displayScreen) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setDisplayScreen(currentScreen)
        setIsTransitioning(false)
      }, 300) // Match CSS transition duration
      return () => clearTimeout(timer)
    }
  }, [currentScreen, displayScreen])

  const renderScreen = () => {
    switch (currentScreen) {
      case 'boot':
        return <BootScreen />
      case 'login':
        return <LoginScreen />
      case 'main':
        return <MenuScreen title="Main Menu" items={menuItems} selectedIndex={selectedIndex} />
      case 'music':
        return <MenuScreen title="Music" items={menuItems} selectedIndex={selectedIndex} />
      case 'settings':
        return <SettingsScreen userProfile={userProfile} onLogout={onLogout} />
      case 'playlists':
        return <MenuScreen title="Playlists" items={menuItems} selectedIndex={selectedIndex} />
      case 'songs':
        return <MenuScreen title="Songs" items={menuItems} selectedIndex={selectedIndex} isLoading={isLoading} />
      case 'playlistTracks':
        return <MenuScreen title="Playlist" items={menuItems} selectedIndex={selectedIndex} isLoading={isLoading} />
      case 'search':
        return (
          <SearchScreen
            searchResults={searchResults}
            selectedIndex={selectedIndex}
            onSearch={onSearch}
            onSelect={onSelect}
            isLoading={isLoading}
            mode={mode || 'keyboard'}
          />
        )
      case 'searchResults':
        return <MenuScreen title="Results" items={searchResults} selectedIndex={selectedIndex} isLoading={isLoading} />
      case 'nowPlaying':
        return (
          <NowPlayingScreen
            track={currentTrack}
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
          />
        )
      default:
        return <MenuScreen title="Menu" items={[]} selectedIndex={0} />
    }
  }

  return (
    <div className="screen">
      <div
        className={`screen-content ${isTransitioning ? 'transitioning' : ''} ${
          transitionDirection === 'forward' ? 'slide-left' : 'slide-right'
        }`}
      >
        {renderScreen()}
      </div>
    </div>
  )
}

export default Screen
