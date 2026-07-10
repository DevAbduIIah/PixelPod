import {
  getStoredTokens,
  getValidToken,
  exchangeCodeForToken,
  clearTokens,
  initiateLogin
} from '@/utils/spotifyAuth'

const SPOTIFY_PROFILE_ENDPOINT = 'https://api.spotify.com/v1/me'

export async function fetchAuthenticatedUserProfile(token) {
  const response = await fetch(SPOTIFY_PROFILE_ENDPOINT, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Unable to fetch Spotify profile')
  }

  return response.json()
}

export async function restoreAuthSession() {
  const storedTokens = getStoredTokens()
  const token = await getValidToken()

  if (!token) {
    return {
      isAuthenticated: false,
      user: null,
      error: storedTokens ? 'Login expired. Connect Spotify again.' : null
    }
  }

  const user = await fetchAuthenticatedUserProfile(token)

  return {
    isAuthenticated: true,
    user,
    error: null
  }
}

export async function completeAuthCallback(code, state) {
  await exchangeCodeForToken(code, state)
  const token = await getValidToken()

  if (!token) {
    throw new Error('Unable to restore Spotify session')
  }

  const user = await fetchAuthenticatedUserProfile(token)

  return {
    isAuthenticated: true,
    user,
    error: null
  }
}

export function beginSpotifyLogin() {
  return initiateLogin()
}

export function clearAuthSession() {
  clearTokens()
}

