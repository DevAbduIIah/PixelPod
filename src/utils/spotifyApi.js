import { getValidToken } from './spotifyAuth'
import { logger } from './logger'

const SPOTIFY_API = 'https://api.spotify.com/v1'

async function fetchWithAuth(endpoint, options = {}) {
  const token = await getValidToken()

  if (!token) {
    throw new Error('Not authenticated - please log in again')
  }

  const response = await fetch(`${SPOTIFY_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    logger.error('Spotify API error:', {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      error
    })

    // Handle specific error cases
    if (response.status === 401) {
      throw new Error('Token expired - please log out and log back in')
    }
    if (response.status === 403) {
      throw new Error('Access denied - try logging out and back in')
    }

    throw new Error(error.error?.message || `API error: ${response.status}`)
  }

  return response.json()
}

// User profile
export async function getUserProfile() {
  return fetchWithAuth('/me')
}

// Get user's playlists
export async function getUserPlaylists(limit = 50, offset = 0) {
  return fetchWithAuth(`/me/playlists?limit=${limit}&offset=${offset}`)
}

// Get playlist tracks
export async function getPlaylistTracks(playlistId, limit = 50, offset = 0) {
  return fetchWithAuth(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`)
}

// Get user's saved tracks (liked songs)
export async function getSavedTracks(limit = 50, offset = 0) {
  return fetchWithAuth(`/me/tracks?limit=${limit}&offset=${offset}`)
}

// Search for tracks, artists, albums, playlists
export async function search(query, types = ['track'], limit = 50) {
  const typeString = types.join(',')
  const searchParams = new URLSearchParams({
    q: query,
    type: typeString
  })
  // Note: limit parameter removed - Spotify search endpoint may not accept it with certain token scopes
  return fetchWithAuth(`/search?${searchParams.toString()}`)
}

// Get user's top tracks
export async function getTopTracks(timeRange = 'medium_term', limit = 20) {
  return fetchWithAuth(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`)
}

// Get recently played tracks
export async function getRecentlyPlayed(limit = 20) {
  return fetchWithAuth(`/me/player/recently-played?limit=${limit}`)
}

// Get track details
export async function getTrack(trackId) {
  return fetchWithAuth(`/tracks/${trackId}`)
}

// Get album details
export async function getAlbum(albumId) {
  return fetchWithAuth(`/albums/${albumId}`)
}

// Get artist details
export async function getArtist(artistId) {
  return fetchWithAuth(`/artists/${artistId}`)
}

// Format track data for our app
export function formatTrack(track) {
  if (!track) return null

  // Handle both regular track and saved track format
  const actualTrack = track.track || track

  return {
    id: actualTrack.id,
    uri: actualTrack.uri,
    title: actualTrack.name,
    artist: actualTrack.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    album: actualTrack.album?.name || 'Unknown Album',
    albumArt: actualTrack.album?.images?.[0]?.url || null,
    albumArtSmall: actualTrack.album?.images?.[2]?.url || actualTrack.album?.images?.[0]?.url || null,
    duration: actualTrack.duration_ms,
    previewUrl: actualTrack.preview_url
  }
}

// Format playlist data for our app
export function formatPlaylist(playlist) {
  if (!playlist) return null

  return {
    id: playlist.id,
    uri: playlist.uri, // Add URI for context playback
    name: playlist.name,
    description: playlist.description,
    trackCount: playlist.tracks?.total || 0,
    image: playlist.images?.[0]?.url || null,
    owner: playlist.owner?.display_name || 'Unknown'
  }
}

// Format album data for our app
export function formatAlbum(album) {
  if (!album) return null

  return {
    id: album.id,
    uri: album.uri,
    type: 'album',
    title: album.name,
    artist: album.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    image: album.images?.[0]?.url || null,
    imageSmall: album.images?.[2]?.url || album.images?.[0]?.url || null,
    releaseDate: album.release_date,
    totalTracks: album.total_tracks
  }
}

// Format artist data for our app
export function formatArtist(artist) {
  if (!artist) return null

  return {
    id: artist.id,
    uri: artist.uri,
    type: 'artist',
    name: artist.name,
    image: artist.images?.[0]?.url || null,
    imageSmall: artist.images?.[2]?.url || artist.images?.[0]?.url || null,
    followers: artist.followers?.total || 0,
    genres: artist.genres || []
  }
}
