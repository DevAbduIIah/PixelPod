import { logger } from './logger'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'pixelpod_tokens'
const AUTH_STATE_KEY = 'pixelpod_auth_state'
const TOKEN_STORAGE_MODE = import.meta.env.VITE_TOKEN_STORAGE || (import.meta.env.PROD ? 'session' : 'local')

const buildApiUrl = (path) => `${API_BASE}${path}`

const getStorage = (mode) => {
  if (typeof window === 'undefined') {
    return null
  }

  return mode === 'session' ? window.sessionStorage : window.localStorage
}

const getPrimaryStorage = () => getStorage(TOKEN_STORAGE_MODE === 'local' ? 'local' : 'session')
const getLegacyStorage = () => getStorage(TOKEN_STORAGE_MODE === 'local' ? 'session' : 'local')

const readStorageItem = (storage, key) => {
  if (!storage) {
    return null
  }

  try {
    return storage.getItem(key)
  } catch (error) {
    logger.error('Error reading auth storage:', error)
    return null
  }
}

const writeStorageItem = (storage, key, value) => {
  if (!storage) {
    return
  }

  try {
    storage.setItem(key, value)
  } catch (error) {
    logger.error('Error writing auth storage:', error)
  }
}

const removeStorageItem = (storage, key) => {
  if (!storage) {
    return
  }

  try {
    storage.removeItem(key)
  } catch (error) {
    logger.error('Error clearing auth storage:', error)
  }
}

const parseJsonSafely = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch (error) {
    logger.error('Error parsing auth response:', error)
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
    const message = data?.error || data?.details?.error_description || data?.details?.error || data?.details
    throw new Error(message || 'Auth request failed')
  }

  return data
}

const parseStoredTokens = (rawTokens) => {
  if (!rawTokens) {
    return null
  }

  try {
    return JSON.parse(rawTokens)
  } catch (error) {
    logger.error('Error reading tokens:', error)
    return null
  }
}

export const getStoredTokens = () => {
  const primaryStorage = getPrimaryStorage()
  const legacyStorage = getLegacyStorage()

  const currentTokens = parseStoredTokens(readStorageItem(primaryStorage, TOKEN_KEY))
  if (currentTokens) {
    return currentTokens
  }

  const legacyTokens = parseStoredTokens(readStorageItem(legacyStorage, TOKEN_KEY))
  if (legacyTokens) {
    writeStorageItem(primaryStorage, TOKEN_KEY, JSON.stringify(legacyTokens))
    removeStorageItem(legacyStorage, TOKEN_KEY)
    return legacyTokens
  }

  return null
}

export const storeTokens = (tokens) => {
  const data = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + (tokens.expires_in * 1000)
  }

  const primaryStorage = getPrimaryStorage()
  const legacyStorage = getLegacyStorage()

  writeStorageItem(primaryStorage, TOKEN_KEY, JSON.stringify(data))
  removeStorageItem(legacyStorage, TOKEN_KEY)

  return data
}

export const clearTokens = () => {
  for (const storage of [getPrimaryStorage(), getLegacyStorage()]) {
    removeStorageItem(storage, TOKEN_KEY)
    removeStorageItem(storage, AUTH_STATE_KEY)
  }
}

export const isTokenExpired = (tokens) => {
  if (!tokens || !tokens.expires_at) return true
  return Date.now() >= tokens.expires_at - 60000
}

export const initiateLogin = async () => {
  const data = await requestAuthJson('/api/auth/login')
  writeStorageItem(getPrimaryStorage(), AUTH_STATE_KEY, data.state)
  window.location.href = data.url
}

export const exchangeCodeForToken = async (code, state) => {
  const primaryStorage = getPrimaryStorage()
  const fallbackStorage = getLegacyStorage()
  const storedState = readStorageItem(primaryStorage, AUTH_STATE_KEY) || readStorageItem(fallbackStorage, AUTH_STATE_KEY)

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
        logger.error('Error refreshing token:', error)
        clearTokens()
        return null
      }
    }

    return null
  }

  return tokens.access_token
}
