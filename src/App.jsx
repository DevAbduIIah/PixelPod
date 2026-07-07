import { useState, useEffect, useCallback } from 'react'
import IPod from './components/IPod'
import { useAuth as useSpotifyAuth } from './context/AuthContext'
import { useSpotify } from './context/SpotifyContext'
import { usePlayback } from './context/PlaybackContext'
import useNavigation from './hooks/useNavigation'
import useQueueManager from './hooks/useQueueManager'
import { logger } from './utils/logger'
import './App.css'

const APPEARANCE_STORAGE_KEY = 'pixelpod_appearance'

function App() {
  const { isAuthenticated, isLoading: authLoading, login, logout, error: authError } = useSpotifyAuth()
  const {
    playlists,
    currentPlaylistTracks,
    likedSongs,
    searchResults,
    selectedPlaylist,
    userProfile,
    isLoading: spotifyLoading,
    error: spotifyError,
    fetchPlaylists,
    fetchLikedSongs,
    selectPlaylist,
    searchTracks,
    fetchUserProfile
  } = useSpotify()
  const {
    isReady: playbackReady,
    isPlaying,
    isLoading: playbackLoading,
    currentProgress,
    duration,
    currentTrack: playbackTrack,
    volume,
    shuffleEnabled,
    repeatMode,
    play,
    togglePlayPause,
    seek,
    toggleShuffle,
    cycleRepeatMode,
    setVolume,
    error: playbackError
  } = usePlayback()

  const [theme, setTheme] = useState('classic')
  const [skin, setSkin] = useState('silver')

  const {
    currentScreen,
    setCurrentScreen,
    selectedIndex,
    setSelectedIndex,
    setMenuHistory,
    transitionDirection,
    searchMode,
    setSearchMode,
    navigateForward,
    handleBack,
    handleNext,
    handlePrevious,
    getMenuItems,
    getSearchTrackResults,
    resetNavigation
  } = useNavigation({
    playlists,
    currentPlaylistTracks,
    likedSongs,
    searchResults,
    spotifyLoading,
    spotifyError,
    authError,
    selectPlaylist
  })

  const {
    currentTrack,
    setCurrentSourceTracks,
    queueShuffleEnabled,
    effectiveShuffleEnabled,
    getCurrentTracks,
    createLikedSongsQueue,
    applyTrackSelection,
    handleSkipForward,
    handleSkipBack,
    handleToggleShuffle,
    resetQueue
  } = useQueueManager({
    playbackTrack,
    playbackReady,
    play,
    toggleShuffle,
    shuffleEnabled,
    isPlaying,
    currentProgress,
    currentPlaylistTracks,
    likedSongs,
    currentScreen
  })

  const progress = duration > 0 ? (currentProgress / duration) * 100 : 0

  // Appearance persistence
  useEffect(() => {
    try {
      const savedAppearance = localStorage.getItem(APPEARANCE_STORAGE_KEY)
      if (!savedAppearance) return

      const parsedAppearance = JSON.parse(savedAppearance)

      if (parsedAppearance.theme) {
        setTheme(parsedAppearance.theme)
      }

      if (parsedAppearance.skin) {
        setSkin(parsedAppearance.skin)
      }
    } catch (error) {
      logger.error('Error restoring appearance settings:', error)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme, skin }))
    } catch (error) {
      logger.error('Error saving appearance settings:', error)
    }
  }, [theme, skin])

  // Boot and auth flow
  useEffect(() => {
    if (currentScreen === 'boot') {
      const timer = setTimeout(() => {
        if (authLoading) return
        setCurrentScreen(isAuthenticated ? 'main' : 'login')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [currentScreen, isAuthenticated, authLoading, setCurrentScreen])

  useEffect(() => {
    if (!authLoading && currentScreen === 'boot') return
    if (!authLoading && currentScreen === 'login' && isAuthenticated) {
      setCurrentScreen('main')
      setMenuHistory([])
      setSelectedIndex(0)
    }
  }, [isAuthenticated, authLoading, currentScreen, setCurrentScreen, setMenuHistory, setSelectedIndex])

  // Data fetching
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile()
    }
  }, [isAuthenticated, fetchUserProfile])

  useEffect(() => {
    if (isAuthenticated && currentScreen === 'playlists' && playlists.length === 0) {
      fetchPlaylists()
    }
  }, [isAuthenticated, currentScreen, playlists.length, fetchPlaylists])

  useEffect(() => {
    if (isAuthenticated && currentScreen === 'songs' && likedSongs.length === 0) {
      fetchLikedSongs()
    }
  }, [isAuthenticated, currentScreen, likedSongs.length, fetchLikedSongs])

  // Orchestration handlers
  const handleSelect = useCallback(async () => {
    if (currentScreen === 'login') {
      login()
      return
    }

    if (spotifyLoading) return

    if (currentScreen === 'search') {
      const searchTrackResults = getSearchTrackResults()

      if (searchTrackResults.length > 0 && searchMode === 'results') {
        const track = searchTrackResults[selectedIndex]

        if (track) {
          setCurrentSourceTracks(searchTrackResults)
          applyTrackSelection(searchTrackResults, selectedIndex, { kind: 'search' })
          navigateForward('nowPlaying')
          setSearchMode('keyboard')

          if (track.uri) {
            play(track.uri)
          }
        }
      }

      return
    }

    const items = getMenuItems()
    if (items.length === 0) return

    if (currentScreen === 'main') {
      if (selectedIndex === 0) {
        navigateForward('music')
      } else if (selectedIndex === 1) {
        if (currentTrack) {
          navigateForward('nowPlaying')
        }
      } else if (selectedIndex === 2) {
        navigateForward('settings')
      }
    } else if (currentScreen === 'music') {
      if (selectedIndex === 0) {
        navigateForward('playlists')
      } else if (selectedIndex === 1) {
        navigateForward('songs')
      } else if (selectedIndex === 2) {
        navigateForward('search')
      }
    } else if (currentScreen === 'playlists') {
      if (playlists[selectedIndex]) {
        await selectPlaylist(playlists[selectedIndex])
        navigateForward('playlistTracks')
      }
    } else if (currentScreen === 'playlistTracks' || currentScreen === 'songs') {
      const tracks = getCurrentTracks()
      if (tracks[selectedIndex]) {
        const selectedTrack = tracks[selectedIndex]
        navigateForward('nowPlaying')

        if (currentScreen === 'playlistTracks' && selectedPlaylist?.uri) {
          setCurrentSourceTracks(tracks)
          applyTrackSelection(tracks, selectedIndex, {
            kind: 'playlist',
            contextUri: selectedPlaylist.uri
          })
          play(selectedTrack.uri, selectedPlaylist.uri, selectedIndex)
        } else {
          const likedSongsQueue = createLikedSongsQueue(tracks, selectedTrack.id, queueShuffleEnabled)
          const queueUris = likedSongsQueue.map((track) => track.uri).filter(Boolean)

          setCurrentSourceTracks(tracks)
          applyTrackSelection(likedSongsQueue, 0, {
            kind: 'queue'
          })

          if (queueUris.length > 0) {
            if (shuffleEnabled) {
              await toggleShuffle({
                syncRemote: true,
                forceState: false
              })
            }

            play(queueUris[0], null, 0, queueUris)
          }
        }
      }
    }
  }, [
    currentScreen,
    selectedIndex,
    login,
    spotifyLoading,
    getSearchTrackResults,
    searchMode,
    navigateForward,
    play,
    getMenuItems,
    currentTrack,
    playlists,
    selectPlaylist,
    getCurrentTracks,
    selectedPlaylist,
    createLikedSongsQueue,
    toggleShuffle,
    shuffleEnabled,
    queueShuffleEnabled,
    applyTrackSelection,
    setCurrentSourceTracks,
    setSearchMode
  ])

  const handleSearch = useCallback(async (query) => {
    const results = await searchTracks(query)

    if (results && results.length > 0) {
      setSearchMode('results')
      setSelectedIndex(0)
    }
  }, [searchTracks, setSearchMode, setSelectedIndex])

  const handlePlayPause = useCallback(() => {
    if (currentTrack && playbackReady) {
      togglePlayPause()
    }
  }, [currentTrack, playbackReady, togglePlayPause])

  const handleLogout = useCallback(() => {
    logout()
    resetNavigation()
    resetQueue()
  }, [logout, resetNavigation, resetQueue])

  const handleSeek = useCallback((positionMs) => {
    if (playbackReady && duration > 0) {
      seek(positionMs)
    }
  }, [playbackReady, duration, seek])

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume)
  }, [setVolume])

  return (
    <div className={`app theme-${theme} skin-${skin}`}>
      <IPod
        currentScreen={currentScreen}
        menuItems={getMenuItems()}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
        onBack={handleBack}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onPlayPause={handlePlayPause}
        onSkipForward={handleSkipForward}
        onSkipBack={handleSkipBack}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isLoading={playbackLoading}
        progress={progress}
        currentProgress={currentProgress}
        duration={duration}
        volume={volume}
        shuffleEnabled={effectiveShuffleEnabled}
        repeatMode={repeatMode}
        onSeek={handleSeek}
        onToggleShuffle={handleToggleShuffle}
        onCycleRepeatMode={cycleRepeatMode}
        onVolumeChange={handleVolumeChange}
        playbackError={playbackError}
        playbackReady={playbackReady}
        searchResults={searchResults}
        spotifyError={spotifyError}
        onSearch={handleSearch}
        searchMode={searchMode}
        userProfile={userProfile}
        onLogout={handleLogout}
        transitionDirection={transitionDirection}
        theme={theme}
        skin={skin}
        onThemeChange={setTheme}
        onSkinChange={setSkin}
      />
    </div>
  )
}

export default App
