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
      let allPlaylists = []
      let offset = 0
      const limit = 50
      let hasMore = true

      while (hasMore) {
        const data = await getUserPlaylists(limit, offset)
        const formattedPlaylists = data.items.map(formatPlaylist).filter(Boolean)
        allPlaylists = [...allPlaylists, ...formattedPlaylists]

        offset += limit
        hasMore = data.items.length === limit && data.next
      }

      setPlaylists(allPlaylists)
      return allPlaylists
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
      let allTracks = []
      let offset = 0
      const limit = 50
      let hasMore = true

      while (hasMore) {
        const data = await getPlaylistTracks(playlistId, limit, offset)
        const formattedTracks = data.items.map(formatTrack).filter(Boolean)
        allTracks = [...allTracks, ...formattedTracks]

        offset += limit
        hasMore = data.items.length === limit && data.next
      }

      setCurrentPlaylistTracks(allTracks)
      return allTracks
    } catch (err) {
      console.error('Error fetching playlist tracks:', err)

      // Handle specific playlist access errors
      if (err.message.includes('Access denied')) {
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
      let allTracks = []
      let offset = 0
      const limit = 50
      let hasMore = true

      while (hasMore) {
        const data = await getSavedTracks(limit, offset)
        const formattedTracks = data.items.map(formatTrack).filter(Boolean)
        allTracks = [...allTracks, ...formattedTracks]

        offset += limit
        hasMore = data.items.length === limit && data.next
      }

      setLikedSongs(allTracks)
      return allTracks
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
    console.log('searchTracks called with:', query)
    if (!query.trim()) {
      console.log('Empty query, clearing results')
      setSearchResults([])
      return []
    }

    setIsLoading(true)
    setError(null)
    try {
      console.log('Calling Spotify search API...')
      const data = await search(query, ['track'])
      console.log('Raw API response:', data)
      console.log('Tracks items count:', data?.tracks?.items?.length || 0)
      const formattedTracks = data.tracks.items.map(formatTrack).filter(Boolean)
      console.log('Formatted tracks count:', formattedTracks.length)
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
