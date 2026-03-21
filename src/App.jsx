import { useState, useEffect, useCallback } from 'react'
import IPod from './components/IPod'
import { useSpotifyAuth } from './hooks/useSpotifyAuth'
import { useSpotify } from './context/SpotifyContext'
import { usePlayback } from './hooks/usePlayback'
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
    isPlaying: playbackIsPlaying,
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

  const [currentScreen, setCurrentScreen] = useState('boot')
  const [menuHistory, setMenuHistory] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [currentTrackList, setCurrentTrackList] = useState([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [currentSourceTracks, setCurrentSourceTracks] = useState([])
  const [currentPlaybackSource, setCurrentPlaybackSource] = useState(null)
  const [queueShuffleEnabled, setQueueShuffleEnabled] = useState(false)
  const [searchMode, setSearchMode] = useState('keyboard')
  const [transitionDirection, setTransitionDirection] = useState('forward')
  const [theme, setTheme] = useState('classic')
  const [skin, setSkin] = useState('silver')

  const isPlaying = playbackIsPlaying
  const isQueuePlayback = currentPlaybackSource?.kind === 'queue'
  const effectiveShuffleEnabled = isQueuePlayback ? queueShuffleEnabled : shuffleEnabled
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

  const getSearchTrackResults = useCallback(() => {
    if (Array.isArray(searchResults)) {
      return searchResults
    }

    return searchResults?.tracks || []
  }, [searchResults])

  const createStatusItem = useCallback((tone, title, detail, code = null) => ({
    type: 'status',
    tone,
    title,
    detail,
    code
  }), [])

  const getLibraryStatusItem = useCallback((screenName) => {
    const activeError = spotifyError || authError

    if (activeError) {
      const normalizedError = activeError.toLowerCase()

      if (
        normalizedError.includes('expired') ||
        normalizedError.includes('not authenticated') ||
        normalizedError.includes('token') ||
        normalizedError.includes('permissions changed') ||
        normalizedError.includes('connect spotify again')
      ) {
        return createStatusItem('error', 'Login Expired', 'Connect Spotify again to refresh your library.', 'AUTH')
      }

      if (
        screenName === 'playlistTracks' &&
        (normalizedError.includes('private') || normalizedError.includes('deleted') || normalizedError.includes('not found'))
      ) {
        return createStatusItem('error', 'Playlist Unavailable', 'This playlist could not be opened right now.', 'LOCK')
      }

      return createStatusItem('error', 'Library Unavailable', 'PixelPod could not load Spotify data right now.', 'SYNC')
    }

    if (screenName === 'playlists') {
      return createStatusItem('empty', 'No Playlists Found', 'Save or create a playlist in Spotify to see it here.', 'LIST')
    }

    if (screenName === 'songs') {
      return createStatusItem('empty', 'No Liked Songs', 'Add tracks to Your Library and they will appear here.', 'LIKE')
    }

    return createStatusItem('empty', 'No Tracks Found', 'There are no playable tracks in this view yet.', 'NOTE')
  }, [spotifyError, authError, createStatusItem])

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

  useEffect(() => {
    if (!playbackTrack?.uri) {
      return
    }

    const matchedTrack = currentTrackList.find((track) => (
      track?.id === playbackTrack.id || track?.uri === playbackTrack.uri
    ))

    if (matchedTrack) {
      setCurrentTrack(matchedTrack)

      const matchedIndex = currentTrackList.findIndex((track) => (
        track?.id === playbackTrack.id || track?.uri === playbackTrack.uri
      ))

      if (matchedIndex >= 0) {
        setCurrentTrackIndex(matchedIndex)
      }

      return
    }

    setCurrentTrack(playbackTrack)
  }, [playbackTrack, currentTrackList])

  const getMenuItems = useCallback(() => {
    switch (currentScreen) {
      case 'main':
        return ['Music', 'Now Playing', 'Settings']
      case 'music':
        return ['Playlists', 'Liked Songs', 'Search']
      case 'playlists':
        if (spotifyLoading) return [createStatusItem('loading', 'Loading Playlists', 'Syncing your Spotify library.', 'LOAD')]
        return playlists.length > 0 ? playlists : [getLibraryStatusItem('playlists')]
      case 'playlistTracks':
        if (spotifyLoading) return [createStatusItem('loading', 'Loading Tracks', 'Reading this playlist from Spotify.', 'LOAD')]
        return currentPlaylistTracks.length > 0
          ? currentPlaylistTracks.map((track) => ({
              ...track,
              image: track.albumArtSmall || track.albumArt
            }))
          : [getLibraryStatusItem('playlistTracks')]
      case 'songs':
        if (spotifyLoading) return [createStatusItem('loading', 'Loading Library', 'Checking your liked songs.', 'LOAD')]
        return likedSongs.length > 0
          ? likedSongs.map((track) => ({
              ...track,
              image: track.albumArtSmall || track.albumArt
            }))
          : [getLibraryStatusItem('songs')]
      default:
        return []
    }
  }, [currentScreen, playlists, currentPlaylistTracks, likedSongs, spotifyLoading, createStatusItem, getLibraryStatusItem])

  const getCurrentTracks = useCallback(() => {
    if (currentScreen === 'playlistTracks') return currentPlaylistTracks
    if (currentScreen === 'songs') return likedSongs
    return []
  }, [currentScreen, currentPlaylistTracks, likedSongs])

  const createLinearQueue = useCallback((tracks, selectedTrackIndex) => {
    if (!Array.isArray(tracks) || tracks.length === 0) {
      return []
    }

    return [
      ...tracks.slice(selectedTrackIndex),
      ...tracks.slice(0, selectedTrackIndex)
    ]
  }, [])

  const shuffleTracks = useCallback((tracks) => {
    const shuffledTracks = [...tracks]

    for (let index = shuffledTracks.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      ;[shuffledTracks[index], shuffledTracks[randomIndex]] = [shuffledTracks[randomIndex], shuffledTracks[index]]
    }

    return shuffledTracks
  }, [])

  const createLikedSongsQueue = useCallback((tracks, selectedTrackId, shouldShuffle) => {
    const playableTracks = tracks.filter((track) => track?.uri)
    const selectedTrackIndex = playableTracks.findIndex((track) => track.id === selectedTrackId)
    const safeSelectedTrackIndex = selectedTrackIndex >= 0 ? selectedTrackIndex : 0
    const linearQueue = createLinearQueue(playableTracks, safeSelectedTrackIndex)

    if (!shouldShuffle || linearQueue.length <= 1) {
      return linearQueue
    }

    const [selectedTrack, ...remainingTracks] = linearQueue
    return [selectedTrack, ...shuffleTracks(remainingTracks)]
  }, [createLinearQueue, shuffleTracks])

  const applyTrackSelection = useCallback((tracks, selectedTrackIndex, playbackSource) => {
    const selectedTrack = tracks[selectedTrackIndex]
    if (!selectedTrack) {
      return
    }

    setCurrentTrack(selectedTrack)
    setCurrentTrackList(tracks)
    setCurrentTrackIndex(selectedTrackIndex)
    setCurrentPlaybackSource(playbackSource)
  }, [])

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
    applyTrackSelection
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
        if (currentPlaybackSource?.kind === 'playlist' && currentPlaybackSource.contextUri) {
          setCurrentTrack(nextTrack)
          setCurrentTrackIndex(nextIndex)
          play(nextTrack.uri, currentPlaybackSource.contextUri, nextIndex)
          return
        }

        if (currentPlaybackSource?.kind === 'queue') {
          const reorderedQueue = [
            ...currentTrackList.slice(nextIndex),
            ...currentTrackList.slice(0, nextIndex)
          ]
          const queueUris = reorderedQueue.map((track) => track.uri).filter(Boolean)

          setCurrentTrack(reorderedQueue[0])
          setCurrentTrackList(reorderedQueue)
          setCurrentTrackIndex(0)

          if (queueUris.length > 0) {
            play(queueUris[0], null, 0, queueUris)
          }

          return
        }

        setCurrentTrack(nextTrack)
        setCurrentTrackIndex(nextIndex)
        play(nextTrack.uri)
      }
    }
  }, [currentTrack, playbackReady, currentTrackList, currentTrackIndex, play, currentPlaybackSource])

  const handleSkipBack = useCallback(() => {
    if (currentTrack && playbackReady && currentTrackList.length > 0) {
      const previousIndex = (currentTrackIndex - 1 + currentTrackList.length) % currentTrackList.length
      const previousTrack = currentTrackList[previousIndex]

      if (previousTrack && previousTrack.uri) {
        if (currentPlaybackSource?.kind === 'playlist' && currentPlaybackSource.contextUri) {
          setCurrentTrack(previousTrack)
          setCurrentTrackIndex(previousIndex)
          play(previousTrack.uri, currentPlaybackSource.contextUri, previousIndex)
          return
        }

        if (currentPlaybackSource?.kind === 'queue') {
          const reorderedQueue = [
            ...currentTrackList.slice(previousIndex),
            ...currentTrackList.slice(0, previousIndex)
          ]
          const queueUris = reorderedQueue.map((track) => track.uri).filter(Boolean)

          setCurrentTrack(reorderedQueue[0])
          setCurrentTrackList(reorderedQueue)
          setCurrentTrackIndex(0)

          if (queueUris.length > 0) {
            play(queueUris[0], null, 0, queueUris)
          }

          return
        }

        setCurrentTrack(previousTrack)
        setCurrentTrackIndex(previousIndex)
        play(previousTrack.uri)
      }
    }
  }, [currentTrack, playbackReady, currentTrackList, currentTrackIndex, play, currentPlaybackSource])

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
    setCurrentSourceTracks([])
    setCurrentPlaybackSource(null)
    setQueueShuffleEnabled(false)
  }, [logout])

  const handleSeek = useCallback((positionMs) => {
    if (playbackReady && duration > 0) {
      seek(positionMs)
    }
  }, [playbackReady, duration, seek])

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume)
  }, [setVolume])

  const handleToggleShuffle = useCallback(async () => {
    const nextShuffleState = !effectiveShuffleEnabled
    const isQueuePlaybackActive = currentPlaybackSource?.kind === 'queue'
      && currentSourceTracks.length > 0
      && Boolean(currentTrack?.id)

    await toggleShuffle({
      syncRemote: !isQueuePlaybackActive,
      forceState: nextShuffleState
    })

    if (!isQueuePlaybackActive) {
      return
    }

    const nextQueue = createLikedSongsQueue(currentSourceTracks, currentTrack.id, nextShuffleState)
    const nextQueueUris = nextQueue.map((track) => track.uri).filter(Boolean)

    setQueueShuffleEnabled(nextShuffleState)
    setCurrentTrackList(nextQueue)
    setCurrentTrackIndex(0)
    setCurrentTrack(nextQueue[0] || null)

    if (isPlaying && nextQueueUris.length > 0) {
      await play(nextQueueUris[0], null, 0, nextQueueUris, currentProgress)
    }
  }, [
    effectiveShuffleEnabled,
    toggleShuffle,
    currentPlaybackSource,
    currentSourceTracks,
    currentTrack,
    createLikedSongsQueue,
    isPlaying,
    play,
    currentProgress
  ])

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
