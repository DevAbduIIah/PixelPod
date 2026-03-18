import { createContext, useContext, useState, useCallback } from 'react'
import {
  getUserPlaylists,
  getPlaylistTracks,
  getSavedTracks,
  search,
  getUserProfile,
  formatTrack,
  formatPlaylist
} from '../utils/spotifyApi'

const SpotifyContext = createContext(null)

export function SpotifyProvider({ children }) {
  const [playlists, setPlaylists] = useState([])
  const [currentPlaylistTracks, setCurrentPlaylistTracks] = useState([])
  const [likedSongs, setLikedSongs] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch user's playlists
  const fetchPlaylists = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getUserPlaylists()
      const formattedPlaylists = data.items.map(formatPlaylist).filter(Boolean)
      setPlaylists(formattedPlaylists)
      return formattedPlaylists
    } catch (err) {
      console.error('Error fetching playlists:', err)
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
      const data = await getPlaylistTracks(playlistId)
      const formattedTracks = data.items.map(formatTrack).filter(Boolean)
      setCurrentPlaylistTracks(formattedTracks)
      return formattedTracks
    } catch (err) {
      console.error('Error fetching playlist tracks:', err)
      setError(err.message)
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
      const data = await getSavedTracks()
      const formattedTracks = data.items.map(formatTrack).filter(Boolean)
      setLikedSongs(formattedTracks)
      return formattedTracks
    } catch (err) {
      console.error('Error fetching liked songs:', err)
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Search for tracks
  const searchTracks = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return []
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await search(query, ['track'])
      const formattedTracks = data.tracks.items.map(formatTrack).filter(Boolean)
      setSearchResults(formattedTracks)
      return formattedTracks
    } catch (err) {
      console.error('Error searching:', err)
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const data = await getUserProfile()
      setUserProfile({
        name: data.display_name,
        email: data.email,
        image: data.images?.[0]?.url || null,
        uri: data.uri
      })
      return data
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError(err.message)
      return null
    }
  }, [])

  // Clear search results
  const clearSearch = useCallback(() => {
    setSearchResults([])
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
