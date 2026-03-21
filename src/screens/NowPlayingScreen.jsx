import { useRef, useCallback, useState, useEffect } from 'react'
import './NowPlayingScreen.css'

function NowPlayingScreen({
  track,
  isPlaying,
  isLoading,
  progress,
  currentProgress,
  duration,
  volume,
  shuffleEnabled,
  repeatMode,
  onSeek,
  onToggleShuffle,
  onCycleRepeatMode,
  onVolumeChange,
  onPlayPause,
  playbackError,
  playbackReady
}) {
  const progressBarRef = useRef(null)
  const [displayedArt, setDisplayedArt] = useState(track?.albumArt || null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [visualizerBars, setVisualizerBars] = useState(Array.from({ length: 12 }, () => 0.2))

  useEffect(() => {
    if (!track?.albumArt) {
      setDisplayedArt(null)
      setIsTransitioning(false)
      return
    }

    if (!displayedArt) {
      setDisplayedArt(track.albumArt)
      return
    }

    if (track.albumArt !== displayedArt) {
      setIsTransitioning(true)

      const swapTimer = setTimeout(() => {
        setDisplayedArt(track.albumArt)
      }, 120)

      const settleTimer = setTimeout(() => {
        setIsTransitioning(false)
      }, 260)

      return () => {
        clearTimeout(swapTimer)
        clearTimeout(settleTimer)
      }
    }
  }, [track?.albumArt, displayedArt])

  useEffect(() => {
    if (!track) {
      setVisualizerBars(Array.from({ length: 12 }, () => 0.16))
      return
    }

    if (!isPlaying) {
      setVisualizerBars(Array.from({ length: 12 }, (_, index) => 0.18 + (index % 3) * 0.06))
      return
    }

    const updateVisualizer = () => {
      const seed = Math.floor((currentProgress || Date.now()) / 180)
      setVisualizerBars(
        Array.from({ length: 12 }, (_, index) => {
          const wave = Math.sin((seed + index * 3) / 2.6)
          const pulse = Math.cos((seed + index * 5) / 3.1)
          const value = 0.22 + ((wave + 1) * 0.22) + ((pulse + 1) * 0.12)
          return Math.min(0.96, Math.max(0.16, value))
        })
      )
    }

    updateVisualizer()
    const timer = setInterval(updateVisualizer, 180)
    return () => clearInterval(timer)
  }, [track, isPlaying, currentProgress])

  const formatTime = (ms) => {
    if (!ms || ms < 0) return '0:00'
    const totalSeconds = Math.floor(ms / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleProgressClick = useCallback((event) => {
    if (!progressBarRef.current || !duration || !onSeek) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, clickX / rect.width))
    const seekPosition = Math.floor(percentage * duration)
    onSeek(seekPosition)
  }, [duration, onSeek])

  const getRepeatStateLabel = () => {
    switch (repeatMode) {
      case 'track':
        return 'ONE'
      case 'context':
        return 'ALL'
      default:
        return 'OFF'
    }
  }

  const getReadableRepeatLabel = () => {
    switch (repeatMode) {
      case 'track':
        return 'One'
      case 'context':
        return 'All'
      default:
        return 'Off'
    }
  }

  const getErrorMessage = (error) => {
    if (!error) return null
    if (error.includes('Premium')) return 'Premium Required'
    if (error.includes('device')) return 'Playback Unavailable'
    if (error.includes('authentication') || error.includes('token')) return 'Login Expired'
    return 'Playback Error'
  }

  const getErrorDetail = (error) => {
    if (!error) return ''
    if (error.includes('Premium')) return 'A Spotify Premium account is required for device playback.'
    if (error.includes('device')) return 'Open Spotify on a device and start playback to continue.'
    if (error.includes('authentication') || error.includes('token')) return 'Connect Spotify again to restore playback controls.'
    return error
  }

  const getStatusTone = () => {
    if (playbackError) return 'error'
    if (!playbackReady) return 'waiting'
    if (isLoading) return 'loading'
    if (isPlaying) return 'active'
    return 'idle'
  }

  const getStatusLabel = () => {
    if (playbackError) return getErrorMessage(playbackError)
    if (!playbackReady) return 'Connecting'
    if (isLoading) return 'Buffering'
    if (isPlaying) return 'Playing'
    return 'Paused'
  }

  const getStatusCode = () => {
    if (playbackError) return 'ERR'
    if (!playbackReady) return 'SYNC'
    if (isLoading) return 'LOAD'
    if (isPlaying) return 'PLAY'
    return 'PAUSE'
  }

  if (!track) {
    return (
      <div className="now-playing-screen">
        <div className="now-playing-header">
          <span>Now Playing</span>
          <span className={`status-pill ${getStatusTone()}`}>{getStatusCode()}</span>
        </div>

        <div className="empty-player">
          <div className={`empty-emblem ${getStatusTone()}`}>{getStatusCode()}</div>

          {!playbackReady ? (
            <>
              <div className="empty-title">Connecting to Spotify</div>
              <div className="empty-copy">Please wait while playback controls come online.</div>
            </>
          ) : playbackError ? (
            <>
              <div className="empty-title">{getErrorMessage(playbackError)}</div>
              <div className="empty-copy">{getErrorDetail(playbackError)}</div>
            </>
          ) : (
            <>
              <div className="empty-title">No Track Selected</div>
              <div className="empty-copy">Choose a song from your library to start playback.</div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="now-playing-screen">
      <div className="now-playing-header">
        <span>Now Playing</span>
        <span className={`status-pill ${getStatusTone()}`}>{getStatusLabel()}</span>
      </div>

      <div className="album-showcase">
        <div className={`album-art ${isTransitioning ? 'transitioning' : ''}`}>
          {displayedArt ? (
            <img
              src={displayedArt}
              alt={track.album}
              className={`album-art-image ${isPlaying ? 'playing' : ''}`}
            />
          ) : (
            <div className="album-art-placeholder">PP</div>
          )}

          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}
        </div>

        <div className="track-info">
          <div className="track-title" title={track.title}>{track.title}</div>
          <div className="track-artist" title={track.artist}>{track.artist}</div>
          <div className="track-album" title={track.album}>{track.album}</div>

          <div className="track-status-row">
            <span className="track-status-label">{isPlaying ? 'Active Session' : 'Ready To Resume'}</span>
            <span className="track-status-divider" aria-hidden="true" />
            <span className="track-status-label">{shuffleEnabled ? 'Shuffle On' : 'Linear Queue'}</span>
          </div>
        </div>
      </div>

      <div className="progress-panel">
        <div className="panel-heading">
          <span>Progress</span>
          <span>{formatTime(currentProgress)} / {formatTime(duration)}</span>
        </div>

        <div
          className="progress-bar"
          ref={progressBarRef}
          onClick={handleProgressClick}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          tabIndex={0}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          <div className="progress-handle" style={{ left: `${progress}%` }}></div>
        </div>
      </div>

      <div className="playback-controls" role="group" aria-label="Playback controls">
        <button
          className={`mode-control ${shuffleEnabled ? 'active' : ''}`}
          onClick={onToggleShuffle}
          aria-label={shuffleEnabled ? 'Shuffle on' : 'Shuffle off'}
          title={shuffleEnabled ? 'Shuffle: On' : 'Shuffle: Off'}
        >
          <span className="mode-control-label">Shuffle</span>
          <span className="mode-control-value">{shuffleEnabled ? 'On' : 'Off'}</span>
        </button>

        <button
          className="play-btn"
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          <span className={`play-btn-text ${isLoading ? 'loading' : ''}`}>
            {isLoading ? 'Wait' : isPlaying ? 'Pause' : 'Play'}
          </span>
        </button>

        <button
          className={`mode-control ${repeatMode !== 'off' ? 'active' : ''}`}
          onClick={onCycleRepeatMode}
          aria-label={`Repeat: ${getReadableRepeatLabel()}`}
          title={`Repeat: ${getReadableRepeatLabel()}`}
        >
          <span className="mode-control-label">Repeat</span>
          <span className="mode-control-value">{getRepeatStateLabel()}</span>
        </button>
      </div>

      <div className="visualizer-panel">
        <div className="panel-heading">
          <span>Visualizer</span>
          <span>{isPlaying ? 'Live' : 'Idle'}</span>
        </div>

        <div className={`visualizer-display ${isPlaying ? 'active' : ''}`}>
          {visualizerBars.map((barHeight, index) => (
            <span
              key={index}
              className="visualizer-bar"
              style={{ '--visualizer-height': `${Math.round(barHeight * 100)}%` }}
            ></span>
          ))}
        </div>
      </div>

      <div className="volume-panel">
        <div className="panel-heading">
          <span>Volume</span>
          <span>{volume}%</span>
        </div>

        <div className="volume-bar">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            className="volume-slider"
            aria-label="Volume"
          />
          <div className="volume-fill" style={{ width: `${volume}%` }}></div>
        </div>
      </div>

      {playbackError && (
        <div className="status-note error">{getErrorDetail(playbackError)}</div>
      )}
    </div>
  )
}

export default NowPlayingScreen
