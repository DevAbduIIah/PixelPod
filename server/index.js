import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DIST_DIR = path.resolve(__dirname, '../dist')
const PORT = Number(process.env.PORT || 3001)
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://127.0.0.1:5174/callback'
const HAS_STATIC_BUILD = fs.existsSync(DIST_DIR)
const PKCE_TTL_MS = 10 * 60 * 1000
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX = 10

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('[PixelPod] SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env')
  console.error('[PixelPod] Copy .env.example to .env and fill in your Spotify app credentials.')
  process.exit(1)
}

const app = express()
app.disable('x-powered-by')

// ---------------------------------------------------------------------------
// In-memory rate limiter (per-IP, sliding window)
// ---------------------------------------------------------------------------
const rateLimitStore = new Map()

function authRateLimiter(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS

  let entry = rateLimitStore.get(ip)

  if (!entry) {
    entry = { timestamps: [] }
    rateLimitStore.set(ip, entry)
  }

  // Drop timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

  if (entry.timestamps.length >= RATE_LIMIT_MAX) {
    const retryAfterMs = entry.timestamps[0] + RATE_LIMIT_WINDOW_MS - now
    res.set('Retry-After', String(Math.ceil(retryAfterMs / 1000)))
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000)
    })
  }

  entry.timestamps.push(now)
  next()
}

// Cleanup stale rate-limit entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS
  for (const [ip, entry] of rateLimitStore.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(ip)
    }
  }
}, 5 * 60 * 1000).unref()

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------
const HEX_32_RE = /^[0-9a-f]{32}$/

function validateTokenInput(body) {
  const errors = []
  const { code, state } = body || {}

  if (typeof code !== 'string' || code.length === 0) {
    errors.push('code must be a non-empty string')
  } else if (code.length > 2048) {
    errors.push('code must not exceed 2048 characters')
  }

  if (typeof state !== 'string' || state.length === 0) {
    errors.push('state must be a non-empty string')
  } else if (!HEX_32_RE.test(state)) {
    errors.push('state must be a 32-character hex string')
  }

  return errors
}

function validateRefreshInput(body) {
  const errors = []
  const refreshToken = body?.refresh_token

  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    errors.push('refresh_token must be a non-empty string')
  } else if (refreshToken.length > 512) {
    errors.push('refresh_token must not exceed 512 characters')
  }

  return errors
}

const buildAllowedOrigins = () => {
  const configuredOrigins = [
    process.env.FRONTEND_ORIGIN,
    process.env.CORS_ORIGIN
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (configuredOrigins.length > 0) {
    return new Set(configuredOrigins)
  }

  return new Set([
    'http://127.0.0.1:5174',
    'http://localhost:5174'
  ])
}

const allowedOrigins = buildAllowedOrigins()

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Origin not allowed by PixelPod auth server'))
  }
}))

app.use(express.json({ limit: '16kb' }))

const verifierStore = new Map()

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url')
}

function requireSpotifyConfig(res) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    res.status(500).json({
      error: 'Spotify server configuration is incomplete. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.'
    })
    return false
  }

  return true
}

function setVerifier(state, verifier) {
  verifierStore.set(state, {
    verifier,
    expiresAt: Date.now() + PKCE_TTL_MS
  })
}

function getVerifier(state) {
  const entry = verifierStore.get(state)

  if (!entry) {
    return null
  }

  if (Date.now() > entry.expiresAt) {
    verifierStore.delete(state)
    return null
  }

  return entry.verifier
}

function deleteVerifier(state) {
  verifierStore.delete(state)
}

function cleanupExpiredVerifiers() {
  const now = Date.now()

  for (const [state, entry] of verifierStore.entries()) {
    if (now > entry.expiresAt) {
      verifierStore.delete(state)
    }
  }
}

function buildSpotifyTokenHeaders() {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  if (CLIENT_ID && CLIENT_SECRET) {
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    headers.Authorization = `Basic ${basicAuth}`
  }

  return headers
}

function getSpotifyErrorMessage(error, fallbackMessage) {
  return error.response?.data?.error_description ||
    error.response?.data?.error ||
    error.message ||
    fallbackMessage
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'pixelpod-auth',
    environment: process.env.NODE_ENV || 'development'
  })
})

app.get('/api/auth/login', (_req, res) => {
  if (!requireSpotifyConfig(res)) {
    return
  }

  cleanupExpiredVerifiers()

  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  const state = crypto.randomBytes(16).toString('hex')

  setVerifier(state, codeVerifier)

  const scope = [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
    'user-top-read'
  ].join(' ')

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state,
    scope,
    show_dialog: 'true',
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  })

  res.json({
    url: `https://accounts.spotify.com/authorize?${params.toString()}`,
    state
  })
})

app.post('/api/auth/token', authRateLimiter, async (req, res) => {
  if (!requireSpotifyConfig(res)) {
    return
  }

  const validationErrors = validateTokenInput(req.body)
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Invalid input', details: validationErrors })
  }

  const { code, state } = req.body

  const codeVerifier = getVerifier(state)
  if (!codeVerifier) {
    return res.status(400).json({ error: 'Invalid or expired state parameter' })
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier
      }),
      {
        headers: buildSpotifyTokenHeaders()
      }
    )

    deleteVerifier(state)
    res.json(response.data)
  } catch (error) {
    deleteVerifier(state)

    const spotifyError = error.response?.data?.error
    let userMessage = 'Failed to exchange authorization code'

    if (spotifyError === 'invalid_grant') {
      userMessage = 'Authorization code expired or already used. Please log in again.'
    } else if (spotifyError === 'invalid_client') {
      userMessage = 'Invalid Spotify app credentials. Check your server environment variables.'
    }

    res.status(500).json({
      error: userMessage,
      details: getSpotifyErrorMessage(error, userMessage)
    })
  }
})

app.post('/api/auth/refresh', authRateLimiter, async (req, res) => {
  if (!requireSpotifyConfig(res)) {
    return
  }

  const validationErrors = validateRefreshInput(req.body)
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Invalid input', details: validationErrors })
  }

  const { refresh_token: refreshToken } = req.body

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      {
        headers: buildSpotifyTokenHeaders()
      }
    )

    res.json(response.data)
  } catch (error) {
    const userMessage = 'Failed to refresh token'

    res.status(500).json({
      error: userMessage,
      details: getSpotifyErrorMessage(error, userMessage)
    })
  }
})

if (HAS_STATIC_BUILD) {
  app.use(express.static(DIST_DIR))

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next()
      return
    }

    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

app.listen(PORT, () => {
  const runtimeMode = process.env.NODE_ENV || 'development'
  console.log(`[PixelPod] auth server running on port ${PORT} (${runtimeMode})`)
  console.log(`[PixelPod] redirect URI: ${REDIRECT_URI}`)
  if (HAS_STATIC_BUILD) {
    console.log('[PixelPod] static frontend detected in dist/ and will be served by the auth server')
  }
})
