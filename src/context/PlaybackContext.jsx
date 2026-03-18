import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { getValidToken } from '../utils/spotifyAuth'

const PlaybackContext = createContext(null)

export function PlaybackProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [deviceId, setDeviceId] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(null)
  const playerRef = useRef(null)
  const initializingRef = useRef(false)
  const progressIntervalRef = useRef(null)

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!isAuthenticated || initializingRef.current) return

    initializingRef.current = true

    const initPlayer = async () => {
      const token = await getValidToken()
      if (!token) {
        initializingRef.current = false
        return
      }

      // Wait for SDK to be ready
      const waitForSDK = () => {
        if (window.Spotify && window.Spotify.Player) {
          createPlayer(token)
        } else {
          // SDK not ready yet, try again
          setTimeout(waitForSDK, 100)
        }
      }

      // Load SDK if not already loaded
      if (!window.Spotify) {
        const script = document.createElement('script')
        script.src = 'https://sdk.scdn.co/spotify-player.js'
        script.async = true
        document.head.appendChild(script)

        window.onSpotifyWebPlaybackSDKReady = () => {
          createPlayer(token)
        }
      } else {
        waitForSDK()
      }
    }

    const createPlayer = (token) => {
      try {
        const player = new window.Spotify.Player({
          name: 'PixelPod',
          // IMPORTANT: getOAuthToken receives a callback, we must call it with the token
          getOAuthToken: cb => {
            getValidToken().then(currentToken => {
              cb(currentToken || token)
            })
          },
          volume: 0.5
        })

        playerRef.current = player

        // Track player state changes
        player.addListener('player_state_changed', (state) => {
          if (!state) return

          setIsPlaying(!state.paused)
          setCurrentProgress(state.position)
          setDuration(state.duration)
        })

        // Device ready
        player.addListener('ready', ({ device_id }) => {
          console.log('Spotify player ready with device ID:', device_id)
          setDeviceId(device_id)
          setIsReady(true)
          // Transfer playback to this device without autoplay
          transferPlayback(device_id, token)

          // Start polling for playback state to keep progress updated
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }
          progressIntervalRef.current = setInterval(() => {
            player.getCurrentState().then(state => {
              if (state) {
                setIsPlaying(!state.paused)
                setCurrentProgress(state.position)
                setDuration(state.duration)
              }
            })
          }, 1000)
        })

        // Device not ready
        player.addListener('not_ready', ({ device_id }) => {
          console.warn('Device not ready:', device_id)
          setIsReady(false)
        })

        // Error handlers
        player.addListener('initialization_error', (e) => {
          console.error('Initialization error:', e)
          setError(`Initialization error: ${e.message}`)
        })

        player.addListener('authentication_error', (e) => {
          console.error('Authentication error:', e)
          setError(`Authentication error: ${e.message}`)
        })

        player.addListener('account_error', (e) => {
          console.error('Account error:', e)
          setError(`Account error: ${e.message}`)
        })

        player.addListener('playback_error', (e) => {
          console.error('Playback error:', e)
          setError(`Playback error: ${e.message}`)
        })

        // Connect player
        player.connect().then((success) => {
          if (success) {
            console.log('Spotify player connected successfully')
          } else {
            console.error('Failed to connect Spotify player')
            setError('Failed to connect to Spotify player')
            initializingRef.current = false
          }
        }).catch((err) => {
          console.error('Error connecting to Spotify:', err)
          setError(`Failed to connect to Spotify: ${err.message}`)
          initializingRef.current = false
        })
      } catch (err) {
        console.error('Error creating player:', err)
        setError(`Error creating player: ${err.message}`)
        initializingRef.current = false
      }
    }

    initPlayer()

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (playerRef.current) {
        playerRef.current.disconnect?.()
      }
    }
  }, [isAuthenticated])

  // Transfer playback to this device
  const transferPlayback = useCallback(async (deviceId, authToken) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        })
      })

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({}))
        console.warn('Transfer playback warning:', errorData)
      } else {
        console.log('Playback transferred to device:', deviceId)
      }
    } catch (err) {
      console.error('Error transferring playback:', err)
    }
  }, [])

  // Play a track
  const play = useCallback(async (trackUri) => {
    if (!trackUri) {
      setError('No track URI provided')
      return
    }

    try {
      const token = await getValidToken()
      if (!token) {
        setError('Not authenticated')
        return
      }

      if (!deviceId) {
        setError('No playback device available. Please wait for Spotify to connect.')
        console.error('Cannot play - no deviceId. Player ready:', isReady, 'Player ref:', playerRef.current)
        return
      }

      console.log('Playing track:', trackUri, 'on device:', deviceId)

      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [trackUri]
        })
      })

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error?.message || `HTTP ${response.status}`
        console.error('Play error response:', errorData)
        setError(`Failed to play track: ${errorMsg}`)
      } else {
        console.log('Track playing successfully')
        setError(null)
        setIsPlaying(true)
      }
    } catch (err) {
      console.error('Playback error:', err)
      setError(`Playback error: ${err.message}`)
    }
  }, [deviceId, isReady])

  // Pause playback
  const pause = useCallback(async () => {
    if (!playerRef.current || !deviceId) {
      setError('Player not ready')
      return
    }

    try {
      const token = await getValidToken()
      if (!token) {
        setError('Not authenticated')
        return
      }

      const response = await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok && response.status !== 204) {
        const error = await response.json().catch(() => ({}))
        setError(`Failed to pause: ${error.error?.message || 'Unknown error'}`)
      } else {
        setIsPlaying(false)
      }
    } catch (err) {
      setError(`Pause error: ${err.message}`)
    }
  }, [deviceId])

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await pause()
    } else if (playerRef.current) {
      await playerRef.current.togglePlay()
    }
  }, [isPlaying, pause])

  // Next track
  const next = useCallback(async () => {
    if (!playerRef.current) {
      setError('Player not ready')
      return
    }
    playerRef.current.nextTrack()
  }, [])

  // Previous track
  const previous = useCallback(async () => {
    if (!playerRef.current) {
      setError('Player not ready')
      return
    }
    playerRef.current.previousTrack()
  }, [])

  // Seek to position
  const seek = useCallback(async (position) => {
    if (!playerRef.current) return
    playerRef.current.seek(position)
  }, [])

  const value = {
    isReady,
    isPlaying,
    currentProgress,
    duration,
    deviceId,
    error,
    play,
    pause,
    togglePlayPause,
    next,
    previous,
    seek,
    setError
  }

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  )
}

export function usePlayback() {
  const context = useContext(PlaybackContext)
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider')
  }
  return context
}
