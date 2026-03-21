import {
  formatAlbum,
  formatArtist,
  formatPlaylist,
  formatTrack
} from '../spotifyApi'

describe('spotifyApi formatters', () => {
  it('formats saved-track responses into the app track shape', () => {
    expect(formatTrack({
      track: {
        id: 'track-1',
        uri: 'spotify:track:track-1',
        name: 'Clarity',
        artists: [{ name: 'Zedd' }, { name: 'Foxes' }],
        album: {
          name: 'Clarity',
          images: [
            { url: 'https://cdn.example.com/large.jpg' },
            { url: 'https://cdn.example.com/medium.jpg' },
            { url: 'https://cdn.example.com/small.jpg' }
          ]
        },
        duration_ms: 263000,
        preview_url: 'https://cdn.example.com/preview.mp3'
      }
    })).toEqual({
      id: 'track-1',
      uri: 'spotify:track:track-1',
      title: 'Clarity',
      artist: 'Zedd, Foxes',
      album: 'Clarity',
      albumArt: 'https://cdn.example.com/large.jpg',
      albumArtSmall: 'https://cdn.example.com/small.jpg',
      duration: 263000,
      previewUrl: 'https://cdn.example.com/preview.mp3'
    })
  })

  it('formats playlists, albums, and artists with sensible fallbacks', () => {
    expect(formatPlaylist({
      id: 'playlist-1',
      uri: 'spotify:playlist:playlist-1',
      name: 'Daily Mix',
      description: 'Your favorites',
      tracks: { total: 24 },
      images: [],
      owner: {}
    })).toEqual({
      id: 'playlist-1',
      uri: 'spotify:playlist:playlist-1',
      name: 'Daily Mix',
      description: 'Your favorites',
      trackCount: 24,
      image: null,
      owner: 'Unknown'
    })

    expect(formatAlbum({
      id: 'album-1',
      uri: 'spotify:album:album-1',
      name: 'Random Access Memories',
      artists: [{ name: 'Daft Punk' }],
      images: [{ url: 'https://cdn.example.com/album.jpg' }],
      release_date: '2013-05-17',
      total_tracks: 13
    })).toEqual({
      id: 'album-1',
      uri: 'spotify:album:album-1',
      type: 'album',
      title: 'Random Access Memories',
      artist: 'Daft Punk',
      image: 'https://cdn.example.com/album.jpg',
      imageSmall: 'https://cdn.example.com/album.jpg',
      releaseDate: '2013-05-17',
      totalTracks: 13
    })

    expect(formatArtist({
      id: 'artist-1',
      uri: 'spotify:artist:artist-1',
      name: 'Justice',
      images: [],
      followers: { total: 1234567 },
      genres: ['electro house']
    })).toEqual({
      id: 'artist-1',
      uri: 'spotify:artist:artist-1',
      type: 'artist',
      name: 'Justice',
      image: null,
      imageSmall: null,
      followers: 1234567,
      genres: ['electro house']
    })
  })
})
