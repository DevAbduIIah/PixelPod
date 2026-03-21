import { useState, useEffect, useCallback } from 'react'
import IPod from './components/IPod'
import { useAuth } from './context/AuthContext'
import { useSpotify } from './context/SpotifyContext'
import { usePlayback } from './context/PlaybackContext'
import './App.css'

function App() {
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth()
  const {
    playlists,
    currentPlaylistTracks,
    likedSongs,
    searchResults,
    selectedPlaylist,
    userProfile,
    isLoading: spotifyLoading,
    fetchPlaylists,
    fetchLikedSongs,
    selectPlaylist,
    searchTracks,
    fetchUserProfile
  } = useSpotify()
  const {
    isReady: playbackReady,
    isPlaying: playbackIsPlaying,
    isLoading: playbackLoading,
    currentProgress,
    duration,
    volume,
    shuffleEnabled,
    repeatMode,
    play,
    pause,
    togglePlayPause,
    next,
    previous,
    seek,
    toggleShuffle,
    cycleRepeatMode,
    setVolume,
    adjustVolume,
    error: playbackError
  } = usePlayback()

  const [currentScreen, setCurrentScreen] = useState('boot')
  const [menuHistory, setMenuHistory] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [currentTrackList, setCurrentTrackList] = useState([]) // Track list being played from
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0) // Current position in track list
  const [searchMode, setSearchMode] = useState('keyboard') // 'keyboard' or 'results'
  const [transitionDirection, setTransitionDirection] = useState('forward') // 'forward' or 'back'

  // Sync playback state with real playback
  const isPlaying = playbackIsPlaying
  const progress = duration > 0 ? (currentProgress / duration) * 100 : 0

  // Boot screen timeout - then show login or main menu
  useEffect(() => {
    if (currentScreen === 'boot') {
      const timer = setTimeout(() => {
        if (authLoading) return
        setCurrentScreen(isAuthenticated ? 'main' : 'login')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [currentScreen, isAuthenticated, authLoading])

  // Update screen when auth state changes
  useEffect(() => {
    if (!authLoading && currentScreen === 'boot') return
    if (!authLoading && currentScreen === 'login' && isAuthenticated) {
      setCurrentScreen('main')
      setMenuHistory([])
      setSelectedIndex(0)
    }
  }, [isAuthenticated, authLoading, currentScreen])

  // Fetch user profile when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile()
    }
  }, [isAuthenticated, fetchUserProfile])

  // Fetch playlists when authenticated and entering playlists screen
  useEffect(() => {
    if (isAuthenticated && currentScreen === 'playlists' && playlists.length === 0) {
      fetchPlaylists()
    }
  }, [isAuthenticated, currentScreen, playlists.length, fetchPlaylists])

  // Fetch liked songs when entering songs screen
  useEffect(() => {
    if (isAuthenticated && currentScreen === 'songs' && likedSongs.length === 0) {
      fetchLikedSongs()
    }
  }, [isAuthenticated, currentScreen, likedSongs.length, fetchLikedSongs])

  // Remove mock progress animation - now using real playback progress

  // Get current menu items based on screen
  const getMenuItems = useCallback(() => {
    switch (currentScreen) {
      case 'main':
        return ['Music', 'Now Playing', 'Settings']
      case 'music':
        return ['Playlists', 'Liked Songs', 'Search']
      case 'playlists':
        if (spotifyLoading) return ['Loading...']
        return playlists.length > 0
          ? playlists.map(p => p.name)
          : ['No playlists found']
      case 'playlistTracks':
        if (spotifyLoading) return ['Loading...']
        return currentPlaylistTracks.length > 0
          ? currentPlaylistTracks.map(t => `${t.title} - ${t.artist}`)
          : ['No tracks found']
      case 'songs':
        if (spotifyLoading) return ['Loading...']
        return likedSongs.length > 0
          ? likedSongs.map(t => `${t.title} - ${t.artist}`)
          : ['No liked songs']
      default:
        return []
    }
  }, [currentScreen, playlists, currentPlaylistTracks, likedSongs, spotifyLoading])

  // Get current data array for track selection
  const getCurrentTracks = useCallback(() => {
    if (currentScreen === 'playlistTracks') return currentPlaylistTracks
    if (currentScreen === 'songs') return likedSongs
    return []
  }, [currentScreen, currentPlaylistTracks, likedSongs])

  // Helper to navigate forward to a new screen
  const navigateForward = useCallback((screen) => {
    setTransitionDirection('forward')
    setMenuHistory([...menuHistory, currentScreen])
    setCurrentScreen(screen)
    setSelectedIndex(0)
  }, [menuHistory, currentScreen])

  const handleSelect = useCallback(async () => {
    console.log('handleSelect called - screen:', currentScreen, 'searchMode:', searchMode, 'selectedIndex:', selectedIndex)

    // Handle login screen
    if (currentScreen === 'login') {
      login()
      return
    }

    // Don't handle select when loading
    if (spotifyLoading) return

    // Handle search screen first (it doesn't use menu items)
    if (currentScreen === 'search') {
      console.log('In search screen - searchResults:', searchResults.length, 'searchMode:', searchMode, 'selectedIndex:', selectedIndex)
      if (searchResults.length > 0 && searchMode === 'results') {
        const track = searchResults[selectedIndex]
        console.log('Attempting to select track:', track?.title)
        if (track) {
          setCurrentTrack(track)
          setCurrentTrackList(searchResults)
          setCurrentTrackIndex(selectedIndex)
          navigateForward('nowPlaying')
          setSearchMode('keyboard')
          if (track.uri) {
            play(track.uri)
          }
        }
      } else {
        console.log('Not selecting - searchMode is not "results" or no results')
      }
      return
    }

    const items = getMenuItems()
    if (items.length === 0) return

    // Handle different screens
    if (currentScreen === 'main') {
      if (selectedIndex === 0) { // Music
        navigateForward('music')
      } else if (selectedIndex === 1) { // Now Playing
        if (currentTrack) {
          navigateForward('nowPlaying')
        }
      } else if (selectedIndex === 2) { // Settings
        navigateForward('settings')
      }
    } else if (currentScreen === 'music') {
      if (selectedIndex === 0) { // Playlists
        navigateForward('playlists')
      } else if (selectedIndex === 1) { // Liked Songs
        navigateForward('songs')
      } else if (selectedIndex === 2) { // Search
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
        setCurrentTrack(selectedTrack)
        setCurrentTrackList(tracks) // Save the track list context
        setCurrentTrackIndex(selectedIndex) // Save the position
        navigateForward('nowPlaying')

        // Play from context (playlist) for shuffle/repeat support
        if (currentScreen === 'playlistTracks' && selectedPlaylist?.uri) {
          // Play from playlist context with offset
          play(selectedTrack.uri, selectedPlaylist.uri, selectedIndex)
        } else {
          // Play single track (for liked songs or when no context available)
          play(selectedTrack.uri)
        }
      }
    }
  }, [
    currentScreen, selectedIndex, login,
    spotifyLoading, getMenuItems, getCurrentTracks,
    playlists, selectPlaylist, currentTrack, play, searchResults, searchMode,
    navigateForward
  ])

  const handleSearch = useCallback(async (query) => {
    console.log('Search triggered for:', query)
    const results = await searchTracks(query)
    console.log('Search results:', results?.length || 0, 'tracks')
    // Use the returned results instead of relying on stale state
    if (results && results.length > 0) {
      setSearchMode('results')
      setSelectedIndex(0)
    }
  }, [searchTracks])

  const handleBack = useCallback(() => {
    // If in search results, go back to keyboard
    if (currentScreen === 'search' && searchMode === 'results') {
      setSearchMode('keyboard')
      setSelectedIndex(-1)
      return
    }

    if (currentScreen === 'playlistTracks') {
      selectPlaylist(null)
    }

    if (menuHistory.length > 0) {
      setTransitionDirection('back')
      const previousScreen = menuHistory[menuHistory.length - 1]
      setMenuHistory(menuHistory.slice(0, -1))
      setCurrentScreen(previousScreen)
      setSelectedIndex(0)
      setSearchMode('keyboard')
    }
  }, [menuHistory, currentScreen, searchMode, selectPlaylist])

  const handleNext = useCallback(() => {
    // Handle search results navigation
    if (currentScreen === 'search' && searchMode === 'results') {
      setSelectedIndex(prev => (prev + 1) % searchResults.length)
      return
    }

    const items = getMenuItems()
    if (items.length > 0) {
      setSelectedIndex(prev => (prev + 1) % items.length)
    }
  }, [currentScreen, searchMode, searchResults.length, getMenuItems])

  const handlePrevious = useCallback(() => {
    // Handle search results navigation
    if (currentScreen === 'search' && searchMode === 'results') {
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length)
      return
    }

    const items = getMenuItems()
    if (items.length > 0) {
      setSelectedIndex(prev => (prev - 1 + items.length) % items.length)
    }
  }, [currentScreen, searchMode, searchResults.length, getMenuItems])

  const handleSkipForward = useCallback(() => {
    if (currentTrack && playbackReady && currentTrackList.length > 0) {
      // Calculate next track index
      const nextIndex = (currentTrackIndex + 1) % currentTrackList.length
      const nextTrack = currentTrackList[nextIndex]

      if (nextTrack && nextTrack.uri) {
        setCurrentTrack(nextTrack)
        setCurrentTrackIndex(nextIndex)
        play(nextTrack.uri)
      }
    }
  }, [currentTrack, playbackReady, currentTrackList, currentTrackIndex, play])

  const handleSkipBack = useCallback(() => {
    if (currentTrack && playbackReady && currentTrackList.length > 0) {
      // Calculate previous track index (wrap around to end if at beginning)
      const prevIndex = (currentTrackIndex - 1 + currentTrackList.length) % currentTrackList.length
      const prevTrack = currentTrackList[prevIndex]

      if (prevTrack && prevTrack.uri) {
        setCurrentTrack(prevTrack)
        setCurrentTrackIndex(prevIndex)
        play(prevTrack.uri)
      }
    }
  }, [currentTrack, playbackReady, currentTrackList, currentTrackIndex, play])

  const handlePlayPause = useCallback(() => {
    // Play/pause should work whenever there's a track, regardless of screen
    if (currentTrack && playbackReady) {
      togglePlayPause()
    }
  }, [currentTrack, playbackReady, togglePlayPause])

  const handleLogout = useCallback(() => {
    logout()
    setCurrentScreen('boot')
    setMenuHistory([])
    setSelectedIndex(0)
    setCurrentTrack(null)
    setCurrentTrackList([])
    setCurrentTrackIndex(0)
  }, [logout])

  const handleSeek = useCallback((positionMs) => {
    if (playbackReady && duration > 0) {
      seek(positionMs)
    }
  }, [playbackReady, duration, seek])

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume)
  }, [setVolume])

  return (
    <div className="app">
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
        shuffleEnabled={shuffleEnabled}
        repeatMode={repeatMode}
        onSeek={handleSeek}
        onToggleShuffle={toggleShuffle}
        onCycleRepeatMode={cycleRepeatMode}
        onVolumeChange={handleVolumeChange}
        playbackError={playbackError}
        playbackReady={playbackReady}
        searchResults={searchResults}
        onSearch={handleSearch}
        searchMode={searchMode}
        userProfile={userProfile}
        onLogout={handleLogout}
        transitionDirection={transitionDirection}
      />
    </div>
  )
}

export default App
