import {
  startPlaybackSession,
  transferPlaybackToDevice,
  updatePlaybackVolume,
  updateRepeatMode,
  updateShuffleState
} from '../playbackService'

describe('playbackService', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('starts a single-track playback session with the expected Spotify payload', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: vi.fn()
    })

    await startPlaybackSession({
      token: 'token-1',
      deviceId: 'device-1',
      trackUri: 'spotify:track:abc123'
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me/player/play?device_id=device-1',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: ['spotify:track:abc123']
        })
      }
    )
  })

  it('starts a queue playback session when a custom URI list is provided', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: vi.fn()
    })

    await startPlaybackSession({
      token: 'token-queue',
      deviceId: 'device-queue',
      trackUris: ['spotify:track:first', 'spotify:track:second']
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me/player/play?device_id=device-queue',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer token-queue',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: ['spotify:track:first', 'spotify:track:second']
        })
      }
    )
  })

  it('starts a queue playback session at the requested playback position', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: vi.fn()
    })

    await startPlaybackSession({
      token: 'token-position',
      deviceId: 'device-position',
      trackUris: ['spotify:track:first', 'spotify:track:second'],
      positionMs: 42000
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me/player/play?device_id=device-position',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer token-position',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: ['spotify:track:first', 'spotify:track:second'],
          position_ms: 42000
        })
      }
    )
  })

  it('starts context playback with a playlist offset for queue-aware playback', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: vi.fn()
    })

    await startPlaybackSession({
      token: 'token-2',
      deviceId: 'device-2',
      contextUri: 'spotify:playlist:xyz987',
      offset: 4
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me/player/play?device_id=device-2',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer token-2',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          context_uri: 'spotify:playlist:xyz987',
          offset: { position: 4 }
        })
      }
    )
  })

  it('sends playback mode updates to the correct device endpoints', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: vi.fn()
    })

    await transferPlaybackToDevice('device-3', 'token-3')
    await updateShuffleState({ token: 'token-3', deviceId: 'device-3', enabled: true })
    await updateRepeatMode({ token: 'token-3', deviceId: 'device-3', mode: 'track' })

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.spotify.com/v1/me/player',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer token-3',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_ids: ['device-3'],
          play: false
        })
      }
    )

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=device-3',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer token-3'
        }
      }
    )

    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'https://api.spotify.com/v1/me/player/repeat?state=track&device_id=device-3',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer token-3'
        }
      }
    )
  })

  it('surfaces Spotify API errors from playback requests', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({
        error: {
          message: 'No active device found'
        }
      })
    })

    await expect(
      updatePlaybackVolume({
        token: 'token-4',
        deviceId: 'device-4',
        volumePercent: 70
      })
    ).rejects.toThrow('No active device found')
  })
})
