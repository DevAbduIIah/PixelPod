import { useState, useEffect, useCallback } from 'react'
import IPod from './components/IPod'
import { useAuth } from './context/AuthContext'
import { useSpotify } from './context/SpotifyContext'
import { usePlayback } from './context/PlaybackContext'
import './App.css'

const APPEARANCE_STORAGE_KEY = 'pixelpod_appearance'

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
    togglePlayPause,
    seek,
    toggleShuffle,
    cycleRepeatMode,
    setVolume,
    error: playbackError
  } = usePlayback()

  const [currentScreen, setCurrentScreen] = useState('boot')
  const [menuHistory, setMenuHistory] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [currentTrackList, setCurrentTrackList] = useState([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [searchMode, setSearchMode] = useState('keyboard')
  const [transitionDirection, setTransitionDirection] = useState('forward')
  const [theme, setTheme] = useState('classic')
  const [skin, setSkin] = useState('silver')

  const isPlaying = playbackIsPlaying
  const progress = duration > 0 ? (currentProgress / duration) * 100 : 0

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
      console.error('Error restoring appearance settings:', error)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme, skin }))
    } catch (error) {
      console.error('Error saving appearance settings:', error)
    }
  }, [theme, skin])

  const getSearchTrackResults = useCallback(() => {
    if (Array.isArray(searchResults)) {
      return searchResults
    }

    return searchResults?.tracks || []
  }, [searchResults])

  useEffect(() => {
    if (currentScreen === 'boot') {
      const timer = setTimeout(() => {
        if (authLoading) return
        setCurrentScreen(isAuthenticated ? 'main' : 'login')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [currentScreen, isAuthenticated, authLoading])

  useEffect(() => {
    if (!authLoading && currentScreen === 'boot') return
    if (!authLoading && currentScreen === 'login' && isAuthenticated) {
      setCurrentScreen('main')
      setMenuHistory([])
      setSelectedIndex(0)
    }
  }, [isAuthenticated, authLoading, currentScreen])

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

  const getMenuItems = useCallback(() => {
    switch (currentScreen) {
      case 'main':
        return ['Music', 'Now Playing', 'Settings']
      case 'music':
        return ['Playlists', 'Liked Songs', 'Search']
      case 'playlists':
        if (spotifyLoading) return ['Loading...']
        return playlists.length > 0 ? playlists : ['No playlists found']
      case 'playlistTracks':
        if (spotifyLoading) return ['Loading...']
        return currentPlaylistTracks.length > 0
          ? currentPlaylistTracks.map((track) => ({
              ...track,
              image: track.albumArtSmall || track.albumArt
            }))
          : ['No tracks found']
      case 'songs':
        if (spotifyLoading) return ['Loading...']
        return likedSongs.length > 0
          ? likedSongs.map((track) => ({
              ...track,
              image: track.albumArtSmall || track.albumArt
            }))
          : ['No liked songs']
      default:
        return []
    }
  }, [currentScreen, playlists, currentPlaylistTracks, likedSongs, spotifyLoading])

  const getCurrentTracks = useCallback(() => {
    if (currentScreen === 'playlistTracks') return currentPlaylistTracks
    if (currentScreen === 'songs') return likedSongs
    return []
  }, [currentScreen, currentPlaylistTracks, likedSongs])

  const navigateForward = useCallback((screen) => {
    setTransitionDirection('forward')
    setMenuHistory((previousHistory) => [...previousHistory, currentScreen])
    setCurrentScreen(screen)
    setSelectedIndex(0)
  }, [currentScreen])

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
          setCurrentTrack(track)
          setCurrentTrackList(searchTrackResults)
          setCurrentTrackIndex(selectedIndex)
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
        setCurrentTrack(selectedTrack)
        setCurrentTrackList(tracks)
        setCurrentTrackIndex(selectedIndex)
        navigateForward('nowPlaying')

        if (currentScreen === 'playlistTracks' && selectedPlaylist?.uri) {
          play(selectedTrack.uri, selectedPlaylist.uri, selectedIndex)
        } else {
          play(selectedTrack.uri)
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
    selectedPlaylist
  ])

  const handleSearch = useCallback(async (query) => {
    const results = await searchTracks(query)

    if (results && results.length > 0) {
      setSearchMode('results')
      setSelectedIndex(0)
    }
  }, [searchTracks])

  const handleBack = useCallback(() => {
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
    const searchTrackResults = getSearchTrackResults()

    if (currentScreen === 'search' && searchMode === 'results' && searchTrackResults.length > 0) {
      setSelectedIndex((previousIndex) => (previousIndex + 1) % searchTrackResults.length)
      return
    }

    const items = getMenuItems()
    if (items.length > 0) {
      setSelectedIndex((previousIndex) => (previousIndex + 1) % items.length)
    }
  }, [currentScreen, searchMode, getSearchTrackResults, getMenuItems])

  const handlePrevious = useCallback(() => {
    const searchTrackResults = getSearchTrackResults()

    if (currentScreen === 'search' && searchMode === 'results' && searchTrackResults.length > 0) {
      setSelectedIndex((previousIndex) => (
        previousIndex - 1 + searchTrackResults.length
      ) % searchTrackResults.length)
      return
    }

    const items = getMenuItems()
    if (items.length > 0) {
      setSelectedIndex((previousIndex) => (previousIndex - 1 + items.length) % items.length)
    }
  }, [currentScreen, searchMode, getSearchTrackResults, getMenuItems])

  const handleSkipForward = useCallback(() => {
    if (currentTrack && playbackReady && currentTrackList.length > 0) {
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
      const previousIndex = (currentTrackIndex - 1 + currentTrackList.length) % currentTrackList.length
      const previousTrack = currentTrackList[previousIndex]

      if (previousTrack && previousTrack.uri) {
        setCurrentTrack(previousTrack)
        setCurrentTrackIndex(previousIndex)
        play(previousTrack.uri)
      }
    }
  }, [currentTrack, playbackReady, currentTrackList, currentTrackIndex, play])

  const handlePlayPause = useCallback(() => {
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
        theme={theme}
        skin={skin}
        onThemeChange={setTheme}
        onSkinChange={setSkin}
      />
    </div>
  )
}

export default App
