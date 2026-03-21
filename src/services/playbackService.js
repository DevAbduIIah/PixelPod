const SPOTIFY_PLAYER_API = 'https://api.spotify.com/v1/me/player'

async function sendPlaybackRequest(path, { token, method = 'PUT', body } = {}) {
  const response = await fetch(`${SPOTIFY_PLAYER_API}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `HTTP ${response.status}`)
  }

  return response
}

export function transferPlaybackToDevice(deviceId, token) {
  return sendPlaybackRequest('', {
    token,
    body: {
      device_ids: [deviceId],
      play: false
    }
  })
}

export function startPlaybackSession({ token, deviceId, trackUri, contextUri, offset = 0 }) {
  const requestBody = contextUri
    ? {
        context_uri: contextUri,
        offset: { position: offset }
      }
    : {
        uris: [trackUri]
      }

  return sendPlaybackRequest(`/play?device_id=${deviceId}`, {
    token,
    body: requestBody
  })
}

export function pausePlaybackSession({ token, deviceId }) {
  return sendPlaybackRequest(`/pause?device_id=${deviceId}`, { token })
}

export function updateShuffleState({ token, deviceId, enabled }) {
  return sendPlaybackRequest(`/shuffle?state=${enabled}&device_id=${deviceId}`, { token })
}

export function updateRepeatMode({ token, deviceId, mode }) {
  return sendPlaybackRequest(`/repeat?state=${mode}&device_id=${deviceId}`, { token })
}

export function updatePlaybackVolume({ token, deviceId, volumePercent }) {
  return sendPlaybackRequest(`/volume?volume_percent=${volumePercent}&device_id=${deviceId}`, { token })
}

