const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

const TOKEN_KEY = 'pixelpod_tokens'

const buildApiUrl = (path) => `${API_BASE}${path}`

const parseJsonSafely = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch (error) {
    console.error('Error parsing auth response:', error)
    return null
  }
}

const formatNetworkError = (error) => {
  if (error instanceof TypeError) {
    return new Error(
      'Could not reach the PixelPod auth server. Start it with "npm run server" or "npm run dev:full" and try again.'
    )
  }

  return error
}

const requestAuthJson = async (path, options = {}) => {
  let response

  try {
    response = await fetch(buildApiUrl(path), options)
  } catch (error) {
    throw formatNetworkError(error)
  }

  const data = await parseJsonSafely(response)

  if (!response.ok) {
    const message = data?.error || data?.details?.error_description || data?.details?.error

    throw new Error(message || 'Auth request failed')
  }

  return data
}

export const getStoredTokens = () => {
  try {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Error reading tokens:', e)
  }
  return null
}

export const storeTokens = (tokens) => {
  const data = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + (tokens.expires_in * 1000)
  }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(data))
  return data
}

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('pixelpod_auth_state')
}

export const isTokenExpired = (tokens) => {
  if (!tokens || !tokens.expires_at) return true
  // Add 60 second buffer
  return Date.now() >= tokens.expires_at - 60000
}

export const initiateLogin = async () => {
  try {
    const data = await requestAuthJson('/api/auth/login')

    // Store state for verification
    localStorage.setItem('pixelpod_auth_state', data.state)

    // Redirect to Spotify
    window.location.href = data.url
  } catch (error) {
    console.error('Error initiating login:', error)
    throw error
  }
}

export const exchangeCodeForToken = async (code, state) => {
  const storedState = localStorage.getItem('pixelpod_auth_state')

  if (state !== storedState) {
    throw new Error('State mismatch - possible CSRF attack')
  }

  const tokens = await requestAuthJson('/api/auth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code, state })
  })

  return storeTokens(tokens)
}

export const refreshAccessToken = async (refreshToken) => {
  const tokens = await requestAuthJson('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  })

  // Keep existing refresh token if not returned
  if (!tokens.refresh_token) {
    tokens.refresh_token = refreshToken
  }

  return storeTokens(tokens)
}

export const getValidToken = async () => {
  const tokens = getStoredTokens()

  if (!tokens) {
    return null
  }

  if (isTokenExpired(tokens)) {
    if (tokens.refresh_token) {
      try {
        const newTokens = await refreshAccessToken(tokens.refresh_token)
        return newTokens.access_token
      } catch (error) {
        console.error('Error refreshing token:', error)
        clearTokens()
        return null
      }
    }
    return null
  }

  return tokens.access_token
}
