import {
  fetchAllPlaylists,
  fetchSpotifyUserProfile,
  searchSpotifyCatalog
} from '../spotifyService'

const mockSpotifyApi = vi.hoisted(() => ({
  getUserPlaylists: vi.fn(),
  getPlaylistTracks: vi.fn(),
  getSavedTracks: vi.fn(),
  search: vi.fn(),
  getUserProfile: vi.fn(),
  formatTrack: vi.fn(),
  formatPlaylist: vi.fn(),
  formatAlbum: vi.fn(),
  formatArtist: vi.fn()
}))

vi.mock('../../utils/spotifyApi', () => mockSpotifyApi)

describe('spotifyService', () => {
  beforeEach(() => {
    mockSpotifyApi.formatPlaylist.mockImplementation((playlist) => ({
      id: playlist.id,
      name: playlist.name
    }))

    mockSpotifyApi.formatTrack.mockImplementation((track) => ({
      id: track.id,
      title: track.name
    }))

    mockSpotifyApi.formatAlbum.mockImplementation((album) => ({
      id: album.id,
      title: album.name
    }))

    mockSpotifyApi.formatArtist.mockImplementation((artist) => ({
      id: artist.id,
      name: artist.name
    }))
  })

  it('loads all playlist pages until Spotify has no more results', async () => {
    const firstPageItems = Array.from({ length: 50 }, (_, index) => ({
      id: `playlist-${index + 1}`,
      name: `Playlist ${index + 1}`
    }))

    mockSpotifyApi.getUserPlaylists
      .mockResolvedValueOnce({
        items: firstPageItems,
        next: 'next-page'
      })
      .mockResolvedValueOnce({
        items: [{ id: 'playlist-51', name: 'Playlist 51' }],
        next: null
      })

    const playlists = await fetchAllPlaylists()

    expect(playlists).toHaveLength(51)
    expect(playlists.at(-1)).toEqual({
      id: 'playlist-51',
      name: 'Playlist 51'
    })
    expect(mockSpotifyApi.getUserPlaylists).toHaveBeenNthCalledWith(1, 50, 0)
    expect(mockSpotifyApi.getUserPlaylists).toHaveBeenNthCalledWith(2, 50, 50)
  })

  it('maps search results into track, album, and artist buckets', async () => {
    mockSpotifyApi.search.mockResolvedValue({
      tracks: {
        items: [{ id: 'track-1', name: 'Track One' }]
      },
      albums: {
        items: [{ id: 'album-1', name: 'Album One' }]
      },
      artists: {
        items: [{ id: 'artist-1', name: 'Artist One' }]
      }
    })

    await expect(searchSpotifyCatalog('clarity')).resolves.toEqual({
      tracks: [{ id: 'track-1', title: 'Track One' }],
      albums: [{ id: 'album-1', title: 'Album One' }],
      artists: [{ id: 'artist-1', name: 'Artist One' }]
    })

    expect(mockSpotifyApi.search).toHaveBeenCalledWith('clarity', ['track', 'album', 'artist'])
  })

  it('normalizes the Spotify user profile fields used by the app', async () => {
    mockSpotifyApi.getUserProfile.mockResolvedValue({
      display_name: 'Pixel User',
      email: 'pixel@example.com',
      images: [{ url: 'https://cdn.example.com/profile.png' }],
      uri: 'spotify:user:pixel'
    })

    await expect(fetchSpotifyUserProfile()).resolves.toEqual({
      name: 'Pixel User',
      email: 'pixel@example.com',
      image: 'https://cdn.example.com/profile.png',
      uri: 'spotify:user:pixel'
    })
  })
})
