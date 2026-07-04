import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { getValidToken } from '../utils/spotifyAuth'
import { formatTrack } from '../utils/spotifyApi'
import {
  transferPlaybackToDevice,
  startPlaybackSession,
  pausePlaybackSession,
  updateShuffleState,
  updateRepeatMode,
  updatePlaybackVolume
} from '../services/playbackService'
import { logger } from '../utils/logger'

const PlaybackContext = createContext(null)

// Repeat modes: 'off' | 'context' | 'track'
const REPEAT_MODES = ['off', 'context', 'track']



export function PlaybackProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [deviceId, setDeviceId] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(null)
  const [volume, setVolumeState] = useState(50)
  const [shuffleEnabled, setShuffleEnabled] = useState(false)
  const [repeatMode, setRepeatModeState] = useState('off')
  const [currentTrack, setCurrentTrack] = useState(null)
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

        const syncPlaybackState = (state) => {
          if (!state) {
            return
          }

          setIsPlaying(!state.paused)
          setCurrentProgress(state.position)
          setDuration(state.duration)
          setCurrentTrack(formatTrack(state.track_window?.current_track))
          setIsLoading(false)

          if (state.shuffle !== undefined) {
            setShuffleEnabled(state.shuffle)
          }

          if (state.repeat_mode !== undefined) {
            const modes = ['off', 'context', 'track']
            setRepeatModeState(modes[state.repeat_mode] || 'off')
          }
        }

        // Track player state changes
        player.addListener('player_state_changed', (state) => {
          if (!state) return
          syncPlaybackState(state)
        })

        // Device ready
        player.addListener('ready', ({ device_id }) => {
          logger.info('Spotify player ready with device ID:', device_id)
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
                syncPlaybackState(state)
              }
            })
          }, 1000)
        })

        // Device not ready
        player.addListener('not_ready', ({ device_id }) => {
          logger.warn('Device not ready:', device_id)
          setIsReady(false)
        })

        // Error handlers
        player.addListener('initialization_error', (e) => {
          logger.error('Initialization error:', e)
          setError(`Initialization error: ${e.message}`)
        })

        player.addListener('authentication_error', (e) => {
          logger.error('Authentication error:', e)
          setError(`Authentication error: ${e.message}`)
        })

        player.addListener('account_error', (e) => {
          logger.error('Account error:', e)
          setError(`Account error: ${e.message}`)
        })

        player.addListener('playback_error', (e) => {
          logger.error('Playback error:', e)
          setError(`Playback error: ${e.message}`)
        })

        // Connect player
        player.connect().then((success) => {
          if (!success) {
            logger.error('Failed to connect Spotify player')
            setError('Failed to connect to Spotify player')
            initializingRef.current = false
          }
        }).catch((err) => {
          logger.error('Error connecting to Spotify:', err)
          setError(`Failed to connect to Spotify: ${err.message}`)
          initializingRef.current = false
        })
      } catch (err) {
        logger.error('Error creating player:', err)
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
      window.onSpotifyWebPlaybackSDKReady = undefined
    }
  }, [isAuthenticated])

  // Transfer playback to this device
  const transferPlayback = useCallback(async (deviceId, authToken) => {
    try {
      await transferPlaybackToDevice(deviceId, authToken)
    } catch (err) {
      logger.error('Error transferring playback:', err)
    }
  }, [])

  // Play a track (with optional context for shuffle/repeat support)
  const play = useCallback(async (trackUri, contextUri = null, offset = 0, trackUris = null, positionMs = null) => {
    if (!trackUri && !contextUri && (!trackUris || trackUris.length === 0)) {
      setError('No track or context URI provided')
      return
    }

    setIsLoading(true)

    try {
      const token = await getValidToken()
      if (!token) {
        setError('Not authenticated')
        setIsLoading(false)
        return
      }

      if (!deviceId) {
        setError('No playback device available. Please wait for Spotify to connect.')
        logger.warn('Cannot play without a ready playback device.')
        setIsLoading(false)
        return
      }

      let requestBody
      if (contextUri) {
        requestBody = { contextUri, offset }
      } else {
        requestBody = { trackUri }
      }

      await startPlaybackSession({
        token,
        deviceId,
        trackUri: requestBody.trackUri,
        trackUris,
        contextUri: requestBody.contextUri,
        offset: requestBody.offset,
        positionMs
      })

      setError(null)
      setIsPlaying(true)
    } catch (err) {
      logger.error('Playback error:', err)
      setError(`Playback error: ${err.message}`)
      setIsLoading(false)
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

      await pausePlaybackSession({ token, deviceId })
      setIsPlaying(false)
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

  // Toggle shuffle
  const toggleShuffle = useCallback(async (options = {}) => {
    const {
      syncRemote = true,
      forceState
    } = options

    const newShuffleState = typeof forceState === 'boolean'
      ? forceState
      : !shuffleEnabled

    if (!syncRemote) {
      setShuffleEnabled(newShuffleState)
      setError(null)
      return newShuffleState
    }

    if (!deviceId) {
      setError('No playback device available')
      return shuffleEnabled
    }

    try {
      const token = await getValidToken()
      if (!token) {
        setError('Not authenticated')
        return shuffleEnabled
      }

      await updateShuffleState({ token, deviceId, enabled: newShuffleState })
      setShuffleEnabled(newShuffleState)
      setError(null)
      return newShuffleState
    } catch (err) {
      logger.error('Shuffle error:', err)
      if (err.message.includes('Player command failed: No active device')) {
        setError('Start playing a track first')
      } else if (err.message.includes('403')) {
        setError('Premium account required')
      } else {
        setError(`Shuffle error: ${err.message}`)
      }
      return shuffleEnabled
    }
  }, [shuffleEnabled, deviceId])

  // Cycle repeat mode: off -> context -> track -> off
  const cycleRepeatMode = useCallback(async () => {
    if (!deviceId) {
      setError('No playback device available')
      return
    }

    try {
      const token = await getValidToken()
      if (!token) {
        setError('Not authenticated')
        return
      }

      const currentIndex = REPEAT_MODES.indexOf(repeatMode)
      const nextMode = REPEAT_MODES[(currentIndex + 1) % REPEAT_MODES.length]

      await updateRepeatMode({ token, deviceId, mode: nextMode })
      setRepeatModeState(nextMode)
      setError(null)
    } catch (err) {
      logger.error('Repeat error:', err)
      if (err.message.includes('Player command failed: No active device')) {
        setError('Start playing a track first')
      } else if (err.message.includes('403')) {
        setError('Premium account required')
      } else {
        setError(`Repeat error: ${err.message}`)
      }
    }
  }, [repeatMode, deviceId])

  // Set volume (0-100)
  const setVolume = useCallback(async (volumePercent) => {
    const clampedVolume = Math.max(0, Math.min(100, Math.round(volumePercent)))

    try {
      // Update local player volume immediately for responsiveness
      if (playerRef.current) {
        playerRef.current.setVolume(clampedVolume / 100)
      }
      setVolumeState(clampedVolume)

      const token = await getValidToken()
      if (!token) return

      await updatePlaybackVolume({ token, deviceId, volumePercent: clampedVolume })
    } catch (err) {
      logger.error('Volume error:', err)
    }
  }, [deviceId])

  // Adjust volume by delta (-10 to +10 typically)
  const adjustVolume = useCallback((delta) => {
    setVolume(volume + delta)
  }, [volume, setVolume])

  const value = {
    isReady,
    isPlaying,
    isLoading,
    currentProgress,
    duration,
    deviceId,
    error,
    currentTrack,
    volume,
    shuffleEnabled,
    repeatMode,
    play,
    pause,
    togglePlayPause,
    next,
    previous,
    seek,
    toggleShuffle,
    cycleRepeatMode,
    setVolume,
    adjustVolume,
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
