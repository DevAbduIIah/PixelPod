import { createContext, useContext, useState, useCallback } from 'react'
import {
  fetchAllPlaylists,
  fetchAllPlaylistTracks,
  fetchAllLikedSongs,
  searchSpotifyCatalog,
  fetchSpotifyUserProfile
} from '../services/spotifyService'
import { logger } from '../utils/logger'

const SpotifyContext = createContext(null)

export function SpotifyProvider({ children }) {
  const [playlists, setPlaylists] = useState([])
  const [currentPlaylistTracks, setCurrentPlaylistTracks] = useState([])
  const [likedSongs, setLikedSongs] = useState([])
  const [searchResults, setSearchResults] = useState({
    tracks: [],
    albums: [],
    artists: []
  })
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch user's playlists
  const fetchPlaylists = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const allPlaylists = await fetchAllPlaylists()
      setPlaylists(allPlaylists)
      return allPlaylists
    } catch (err) {
      logger.error('Error fetching playlists:', err)
      setPlaylists([])
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch tracks from a playlist
  const fetchPlaylistTracks = useCallback(async (playlistId) => {
    setIsLoading(true)
    setError(null)
    try {
      const allTracks = await fetchAllPlaylistTracks(playlistId)
      setCurrentPlaylistTracks(allTracks)
      return allTracks
    } catch (err) {
      logger.error('Error fetching playlist tracks:', err)

      // Handle specific playlist access errors
      const normalizedMessage = err.message.toLowerCase()

      if (
        normalizedMessage.includes('connect spotify again') ||
        normalizedMessage.includes('permissions changed') ||
        normalizedMessage.includes('session expired') ||
        normalizedMessage.includes('not authenticated')
      ) {
        setError(err.message)
      } else if (
        normalizedMessage.includes('private') ||
        normalizedMessage.includes('deleted') ||
        normalizedMessage.includes('not found')
      ) {
        setError('Cannot access this playlist - it may be private or deleted')
      } else {
        setError(err.message)
      }

      // Set empty tracks so UI doesn't hang
      setCurrentPlaylistTracks([])
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch liked songs
  const fetchLikedSongs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const allTracks = await fetchAllLikedSongs()
      setLikedSongs(allTracks)
      return allTracks
    } catch (err) {
      logger.error('Error fetching liked songs:', err)
      setLikedSongs([])
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Search for tracks, albums, and artists
  const searchAll = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults({ tracks: [], albums: [], artists: [] })
      return { tracks: [], albums: [], artists: [] }
    }

    setIsLoading(true)
    setError(null)
    try {
      const results = await searchSpotifyCatalog(query)
      setSearchResults(results)
      return results
    } catch (err) {
      logger.error('Error searching:', err)
      setSearchResults({ tracks: [], albums: [], artists: [] })
      setError(err.message)
      return { tracks: [], albums: [], artists: [] }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Legacy search for tracks only (for backward compatibility)
  const searchTracks = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults({ tracks: [], albums: [], artists: [] })
      return []
    }

    setIsLoading(true)
    setError(null)
    try {
      const { tracks, albums, artists } = await searchSpotifyCatalog(query)
      setSearchResults({ tracks, albums, artists })
      return tracks
    } catch (err) {
      logger.error('Error searching:', err)
      setSearchResults({ tracks: [], albums: [], artists: [] })
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await fetchSpotifyUserProfile()
      setUserProfile(profile)
      return profile
    } catch (err) {
      logger.error('Error fetching user profile:', err)
      setError(err.message)
      return null
    }
  }, [])

  // Clear search results
  const clearSearch = useCallback(() => {
    setSearchResults({ tracks: [], albums: [], artists: [] })
  }, [])

  // Select a playlist
  const selectPlaylist = useCallback(async (playlist) => {
    setSelectedPlaylist(playlist)
    if (playlist) {
      await fetchPlaylistTracks(playlist.id)
    } else {
      setCurrentPlaylistTracks([])
    }
  }, [fetchPlaylistTracks])

  const value = {
    playlists,
    currentPlaylistTracks,
    likedSongs,
    searchResults,
    selectedPlaylist,
    userProfile,
    isLoading,
    error,
    fetchPlaylists,
    fetchPlaylistTracks,
    fetchLikedSongs,
    searchTracks,
    searchAll,
    clearSearch,
    selectPlaylist,
    fetchUserProfile
  }

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  )
}

export function useSpotify() {
  const context = useContext(SpotifyContext)
  if (!context) {
    throw new Error('useSpotify must be used within a SpotifyProvider')
  }
  return context
}
