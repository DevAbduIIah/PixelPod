import {
  getUserPlaylists,
  getPlaylistTracks,
  getSavedTracks,
  search,
  getUserProfile,
  formatTrack,
  formatPlaylist,
  formatAlbum,
  formatArtist
} from '@/utils/spotifyApi'

const PAGE_SIZE = 50

async function fetchAllPages(fetchPage, formatItem) {
  let allItems = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const data = await fetchPage(PAGE_SIZE, offset)
    const formattedItems = (data.items || []).map(formatItem).filter(Boolean)
    allItems = [...allItems, ...formattedItems]

    offset += PAGE_SIZE
    hasMore = data.items?.length === PAGE_SIZE && Boolean(data.next)
  }

  return allItems
}

export function fetchAllPlaylists() {
  return fetchAllPages(getUserPlaylists, formatPlaylist)
}

export function fetchAllPlaylistTracks(playlistId) {
  return fetchAllPages((limit, offset) => getPlaylistTracks(playlistId, limit, offset), formatTrack)
}

export function fetchAllLikedSongs() {
  return fetchAllPages(getSavedTracks, formatTrack)
}

export async function searchSpotifyCatalog(query) {
  if (!query.trim()) {
    return { tracks: [], albums: [], artists: [] }
  }

  const data = await search(query, ['track', 'album', 'artist'])

  return {
    tracks: (data.tracks?.items || []).map(formatTrack).filter(Boolean),
    albums: (data.albums?.items || []).map(formatAlbum).filter(Boolean),
    artists: (data.artists?.items || []).map(formatArtist).filter(Boolean)
  }
}

export async function fetchSpotifyUserProfile() {
  const data = await getUserProfile()

  return {
    name: data.display_name,
    email: data.email,
    image: data.images?.[0]?.url || null,
    uri: data.uri
  }
}

