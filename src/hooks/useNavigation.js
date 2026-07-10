import { useState, useCallback } from 'react'

const buildStatusEntry = (tone, title, detail, code = null) => ({
  type: 'status',
  tone,
  title,
  detail,
  code
})

export default function useNavigation({
  currentTrack: _currentTrack,
  playlists,
  currentPlaylistTracks,
  likedSongs,
  searchResults,
  spotifyLoading,
  spotifyError,
  authError,
  selectPlaylist
}) {
  const [currentScreen, setCurrentScreen] = useState('boot')
  const [menuHistory, setMenuHistory] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [transitionDirection, setTransitionDirection] = useState('forward')
  const [searchMode, setSearchMode] = useState('keyboard')

  const getSearchResults = useCallback(() => {
    if (Array.isArray(searchResults)) {
      return searchResults
    }

    return searchResults?.tracks || []
  }, [searchResults])

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
        return buildStatusEntry('error', 'Login Expired', 'Connect Spotify again to refresh your library.', 'AUTH')
      }

      if (
        screenName === 'playlistTracks' &&
        (normalizedError.includes('private') || normalizedError.includes('deleted') || normalizedError.includes('not found'))
      ) {
        return buildStatusEntry('error', 'Playlist Unavailable', 'This playlist could not be opened right now.', 'LOCK')
      }

      return buildStatusEntry('error', 'Library Unavailable', 'PixelPod could not load Spotify data right now.', 'SYNC')
    }

    if (screenName === 'playlists') {
      return buildStatusEntry('empty', 'No Playlists Found', 'Save or create a playlist in Spotify to see it here.', 'LIST')
    }

    if (screenName === 'songs') {
      return buildStatusEntry('empty', 'No Liked Songs', 'Add tracks to Your Library and they will appear here.', 'LIKE')
    }

    return buildStatusEntry('empty', 'No Tracks Found', 'There are no playable tracks in this view yet.', 'NOTE')
  }, [spotifyError, authError])

  const getMenuItems = useCallback(() => {
    switch (currentScreen) {
      case 'main':
        return ['Music', 'Now Playing', 'Settings']
      case 'music':
        return ['Playlists', 'Liked Songs', 'Search']
      case 'playlists':
        if (spotifyLoading) return [buildStatusEntry('loading', 'Loading Playlists', 'Syncing your Spotify library.', 'LOAD')]
        return playlists.length > 0 ? playlists : [getLibraryStatusItem('playlists')]
      case 'playlistTracks':
        if (spotifyLoading) return [buildStatusEntry('loading', 'Loading Tracks', 'Reading this playlist from Spotify.', 'LOAD')]
        return currentPlaylistTracks.length > 0
          ? currentPlaylistTracks.map((track) => ({
              ...track,
              image: track.albumArtSmall || track.albumArt
            }))
          : [getLibraryStatusItem('playlistTracks')]
      case 'songs':
        if (spotifyLoading) return [buildStatusEntry('loading', 'Loading Library', 'Checking your liked songs.', 'LOAD')]
        return likedSongs.length > 0
          ? likedSongs.map((track) => ({
              ...track,
              image: track.albumArtSmall || track.albumArt
            }))
          : [getLibraryStatusItem('songs')]
      default:
        return []
    }
  }, [currentScreen, playlists, currentPlaylistTracks, likedSongs, spotifyLoading, getLibraryStatusItem])

  const navigateForward = useCallback((screen) => {
    setTransitionDirection('forward')
    // Store current screen + selected position so back navigation can restore it
    setMenuHistory((prev) => [...prev, { screen: currentScreen, index: selectedIndex }])
    setCurrentScreen(screen)
    setSelectedIndex(0)
  }, [currentScreen, selectedIndex])

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
      const previous = menuHistory[menuHistory.length - 1]
      setMenuHistory(menuHistory.slice(0, -1))
      // Support both old string entries and new {screen, index} entries
      setCurrentScreen(typeof previous === 'string' ? previous : previous.screen)
      setSelectedIndex(typeof previous === 'string' ? 0 : previous.index)
      setSearchMode('keyboard')
    }
  }, [menuHistory, currentScreen, searchMode, selectPlaylist])

  const handleNext = useCallback(() => {
    const searchTrackResults = getSearchResults()

    if (currentScreen === 'search' && searchMode === 'results' && searchTrackResults.length > 0) {
      setSelectedIndex((previousIndex) => (previousIndex + 1) % searchTrackResults.length)
      return
    }

    const items = getMenuItems()
    if (items.length > 0) {
      setSelectedIndex((previousIndex) => (previousIndex + 1) % items.length)
    }
  }, [currentScreen, searchMode, getSearchResults, getMenuItems])

  const handlePrevious = useCallback(() => {
    const searchTrackResults = getSearchResults()

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
  }, [currentScreen, searchMode, getSearchResults, getMenuItems])

  const resetNavigation = useCallback(() => {
    setCurrentScreen('boot')
    setMenuHistory([])
    setSelectedIndex(0)
    setSearchMode('keyboard')
  }, [])

  return {
    currentScreen,
    setCurrentScreen,
    selectedIndex,
    setSelectedIndex,
    menuHistory,
    setMenuHistory,
    transitionDirection,
    searchMode,
    setSearchMode,
    navigateForward,
    handleBack,
    handleNext,
    handlePrevious,
    getMenuItems,
    getSearchResults,
    resetNavigation
  }
}
