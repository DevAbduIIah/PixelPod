import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import crypto from 'crypto'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://127.0.0.1:5174'

// Store for code verifiers (in production, use Redis or database)
const verifierStore = new Map()

// Generate code verifier and challenge for PKCE
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url')
}

// Get Spotify authorization URL
app.get('/api/auth/login', (req, res) => {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  const state = crypto.randomBytes(16).toString('hex')

  // Store verifier with state
  verifierStore.set(state, codeVerifier)

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
    state: state,
    scope: scope,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge
  })

  res.json({
    url: `https://accounts.spotify.com/authorize?${params.toString()}`,
    state: state
  })
})

// Exchange authorization code for access token
app.post('/api/auth/token', async (req, res) => {
  const { code, state } = req.body

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' })
  }

  const codeVerifier = verifierStore.get(state)
  if (!codeVerifier) {
    return res.status(400).json({ error: 'Invalid state parameter' })
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: codeVerifier
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    // Clean up verifier
    verifierStore.delete(state)

    res.json(response.data)
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message)

    // Provide more specific error messages
    const spotifyError = error.response?.data?.error
    let userMessage = 'Failed to exchange authorization code'

    if (spotifyError === 'invalid_grant') {
      userMessage = 'Authorization code expired or already used. Please log in again.'
    } else if (spotifyError === 'invalid_client') {
      userMessage = 'Invalid Spotify app credentials. Check your .env file.'
    }

    res.status(500).json({
      error: userMessage,
      details: error.response?.data || error.message
    })
  }
})

// Refresh access token
app.post('/api/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token is required' })
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: CLIENT_ID
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    res.json(response.data)
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Failed to refresh token',
      details: error.response?.data || error.message
    })
  }
})

app.listen(PORT, () => {
  console.log(`🎵 PixelPod auth server running on http://localhost:${PORT}`)
  console.log(`📱 Make sure your Spotify app redirect URI is set to: ${REDIRECT_URI}`)
})
