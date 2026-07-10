import { useState, useEffect } from 'react'
import BootScreen from '../screens/BootScreen'
import MenuScreen from '../screens/MenuScreen'
import NowPlayingScreen from '../screens/NowPlayingScreen'
import LoginScreen from '../screens/LoginScreen'
import SearchScreen from '../screens/SearchScreen'
import SettingsScreen from '../screens/SettingsScreen'
import './Screen.css'

// Transition timing (ms) for screen swap animations
const TRANSITION_SWAP_MS = 160
const TRANSITION_SETTLE_MS = 320

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
  searchResults,
  spotifyError,
  onSearch,
  onSelect,
  mode,
  userProfile,
  onLogout,
  transitionDirection,
  theme,
  skin,
  onThemeChange,
  onSkinChange
}) {
  const [displayScreen, setDisplayScreen] = useState(currentScreen)
  const [transitionPhase, setTransitionPhase] = useState('idle')

  useEffect(() => {
    if (currentScreen !== displayScreen) {
      setTransitionPhase('exiting')

      const swapTimer = setTimeout(() => {
        setDisplayScreen(currentScreen)
        setTransitionPhase('entering')
      }, TRANSITION_SWAP_MS)

      const settleTimer = setTimeout(() => {
        setTransitionPhase('idle')
      }, TRANSITION_SETTLE_MS)

      return () => {
        clearTimeout(swapTimer)
        clearTimeout(settleTimer)
      }
    }
  }, [currentScreen, displayScreen])

  const renderScreen = (screenName) => {
    switch (screenName) {
      case 'boot':
        return <BootScreen />
      case 'login':
        return <LoginScreen />
      case 'main':
        return <MenuScreen title="Main Menu" items={menuItems} selectedIndex={selectedIndex} />
      case 'music':
        return <MenuScreen title="Music" items={menuItems} selectedIndex={selectedIndex} />
      case 'settings':
        return (
          <SettingsScreen
            userProfile={userProfile}
            onLogout={onLogout}
            theme={theme}
            skin={skin}
            onThemeChange={onThemeChange}
            onSkinChange={onSkinChange}
          />
        )
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
            error={spotifyError}
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
            theme={theme}
          />
        )
      default:
        return <MenuScreen title="Menu" items={[]} selectedIndex={0} />
    }
  }

  return (
    <div className="screen">
      <div
        className={`screen-content ${transitionPhase} ${
          transitionDirection === 'forward' ? 'slide-left' : 'slide-right'
        }`}
      >
        {renderScreen(displayScreen)}
      </div>
    </div>
  )
}

export default Screen
