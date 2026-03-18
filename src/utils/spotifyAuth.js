const API_BASE = 'http://localhost:3001'

const TOKEN_KEY = 'pixelpod_tokens'

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
    const response = await fetch(`${API_BASE}/api/auth/login`)
    const data = await response.json()

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

  const response = await fetch(`${API_BASE}/api/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ code, state })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Token exchange failed')
  }

  const tokens = await response.json()
  return storeTokens(tokens)
}

export const refreshAccessToken = async (refreshToken) => {
  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  })

  if (!response.ok) {
    throw new Error('Token refresh failed')
  }

  const tokens = await response.json()

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
