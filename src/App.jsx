import { useState, useEffect, useCallback } from 'react'
import IPod from './components/IPod'
import { useAuth } from './context/AuthContext'
import { useSpotify } from './context/SpotifyContext'
import { usePlayback } from './context/PlaybackContext'
import './App.css'

function App() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth()
  const {
    playlists,
    currentPlaylistTracks,
    likedSongs,
    searchResults,
    selectedPlaylist,
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
    currentProgress,
    duration,
    play,
    pause,
    togglePlayPause,
    next,
    previous,
    error: playbackError
  } = usePlayback()

  const [currentScreen, setCurrentScreen] = useState('boot')
  const [menuHistory, setMenuHistory] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [searchMode, setSearchMode] = useState('keyboard') // 'keyboard' or 'results'

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

  const handleSelect = useCallback(() => {
    // Handle login screen
    if (currentScreen === 'login') {
      login()
      return
    }

    // Don't handle select when loading
    if (spotifyLoading) return

    const items = getMenuItems()
    if (items.length === 0) return

    // Handle different screens
    if (currentScreen === 'main') {
      if (selectedIndex === 0) { // Music
        setMenuHistory([...menuHistory, currentScreen])
        setCurrentScreen('music')
        setSelectedIndex(0)
      } else if (selectedIndex === 1) { // Now Playing
        if (currentTrack) {
          setMenuHistory([...menuHistory, currentScreen])
          setCurrentScreen('nowPlaying')
        }
      }
    } else if (currentScreen === 'music') {
      if (selectedIndex === 0) { // Playlists
        setMenuHistory([...menuHistory, currentScreen])
        setCurrentScreen('playlists')
        setSelectedIndex(0)
      } else if (selectedIndex === 1) { // Liked Songs
        setMenuHistory([...menuHistory, currentScreen])
        setCurrentScreen('songs')
        setSelectedIndex(0)
      } else if (selectedIndex === 2) { // Search
        setMenuHistory([...menuHistory, currentScreen])
        setCurrentScreen('search')
        setSelectedIndex(0)
      }
    } else if (currentScreen === 'playlists') {
      if (playlists[selectedIndex]) {
        selectPlaylist(playlists[selectedIndex])
        setMenuHistory([...menuHistory, currentScreen])
        setCurrentScreen('playlistTracks')
        setSelectedIndex(0)
      }
    } else if (currentScreen === 'playlistTracks' || currentScreen === 'songs') {
      const tracks = getCurrentTracks()
      if (tracks[selectedIndex]) {
        const selectedTrack = tracks[selectedIndex]
        setCurrentTrack(selectedTrack)
        setMenuHistory([...menuHistory, currentScreen])
        setCurrentScreen('nowPlaying')
        // Play the track using real Spotify playback
        // Don't check playbackReady - let play() handle device availability
        if (selectedTrack.uri) {
          play(selectedTrack.uri)
        }
      }
    } else if (currentScreen === 'search') {
      // Handle search screen - if results exist and we're viewing them, select a track
      if (searchResults.length > 0 && searchMode === 'results') {
        const track = searchResults[selectedIndex]
        if (track) {
          setCurrentTrack(track)
          setMenuHistory([...menuHistory, currentScreen])
          setCurrentScreen('nowPlaying')
          setSearchMode('keyboard') // Reset search mode
          // Play the track using real Spotify playback
          if (track.uri) {
            play(track.uri)
          }
        }
      }
    }
  }, [
    currentScreen, selectedIndex, menuHistory, login,
    spotifyLoading, getMenuItems, getCurrentTracks,
    playlists, selectPlaylist, currentTrack, play, searchResults, searchMode
  ])

  const handleSearch = useCallback(async (query) => {
    const results = await searchTracks(query)
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
    if (currentTrack && playbackReady) {
      next()
    }
  }, [currentTrack, playbackReady, next])

  const handleSkipBack = useCallback(() => {
    if (currentTrack && playbackReady) {
      previous()
    }
  }, [currentTrack, playbackReady, previous])

  const handlePlayPause = useCallback(() => {
    // Play/pause should work whenever there's a track, regardless of screen
    if (currentTrack && playbackReady) {
      togglePlayPause()
    }
  }, [currentTrack, playbackReady, togglePlayPause])

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
        progress={progress}
        isLoading={spotifyLoading}
        searchResults={searchResults}
        onSearch={handleSearch}
        searchMode={searchMode}
      />
    </div>
  )
}

export default App
