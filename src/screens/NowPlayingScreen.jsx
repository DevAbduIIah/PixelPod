import { useRef, useCallback, useState, useEffect } from 'react'
import { formatTime } from '@/utils/format'
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
  // Two-layer CSS crossfade — no JS timers, GPU-accelerated
  const [artLayers, setArtLayers] = useState({
    current: track?.albumArt || null,
    outgoing: null
  })

  useEffect(() => {
    const incoming = track?.albumArt || null
    if (incoming === artLayers.current) return

    setArtLayers((prev) => ({
      current: incoming,
      outgoing: prev.current
    }))
  }, [track?.albumArt]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleArtTransitionEnd = useCallback(() => {
    setArtLayers((prev) => ({ ...prev, outgoing: null }))
  }, [])

  const progressBarRef = useRef(null)
  const volumeBarRef = useRef(null)

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
          <div className={`empty-emblem ${getStatusTone()}`}>
            {/* Vinyl / disc SVG — spins when connecting, pulses when idle */}
            <svg className="vinyl-icon" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
              <circle cx="20" cy="20" r="12" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" />
              <circle cx="20" cy="20" r="6" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
              <circle cx="20" cy="20" r="2.5" fill="currentColor" fillOpacity="0.55" />
              <line x1="20" y1="4" x2="20" y2="8" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
              <line x1="20" y1="32" x2="20" y2="36" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
              <line x1="4" y1="20" x2="8" y2="20" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
              <line x1="32" y1="20" x2="36" y2="20" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
            </svg>
          </div>

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
        <div className="album-art">
          {/* Outgoing layer fades out */}
          {artLayers.outgoing && (
            <img
              key={artLayers.outgoing}
              src={artLayers.outgoing}
              alt=""
              className="album-art-image art-layer exiting"
              onTransitionEnd={handleArtTransitionEnd}
              aria-hidden="true"
            />
          )}
          {/* Current layer fades in */}
          {artLayers.current ? (
            <img
              key={artLayers.current}
              src={artLayers.current}
              alt={track.album}
              className={`album-art-image art-layer ${isPlaying ? 'playing' : ''}`}
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

      <div className="volume-panel">
        <div className="panel-heading">
          <span>Volume</span>
          <span>{volume}%</span>
        </div>

        <div
          className="volume-bar"
          ref={volumeBarRef}
          style={{ '--volume-val': `${volume}%` }}
        >
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            onInput={(event) => {
              // Sync fill immediately on keyboard steps (before React re-render)
              if (volumeBarRef.current) {
                volumeBarRef.current.style.setProperty('--volume-val', `${event.target.value}%`)
              }
            }}
            className="volume-slider"
            aria-label="Volume"
            step="5"
          />
          <div className="volume-fill" />
        </div>
      </div>

      {playbackError && (
        <div className="status-note error">{getErrorDetail(playbackError)}</div>
      )}
    </div>
  )
}

export default NowPlayingScreen
