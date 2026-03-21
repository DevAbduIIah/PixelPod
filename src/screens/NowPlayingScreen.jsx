import { useRef, useCallback } from 'react'
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

  const formatTime = (ms) => {
    if (!ms || ms < 0) return '0:00'
    const totalSeconds = Math.floor(ms / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleProgressClick = useCallback((e) => {
    if (!progressBarRef.current || !duration || !onSeek) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, clickX / rect.width))
    const seekPosition = Math.floor(percentage * duration)
    onSeek(seekPosition)
  }, [duration, onSeek])

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'track':
        return '🔂'
      case 'context':
        return '🔁'
      default:
        return '➡️'
    }
  }

  const getRepeatLabel = () => {
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
    if (error.includes('device')) return 'No Device Found'
    if (error.includes('authentication') || error.includes('token')) return 'Login Expired'
    return 'Playback Error'
  }

  if (!track) {
    return (
      <div className="now-playing-screen">
        <div className="now-playing-header">Now Playing</div>
        <div className="no-track">
          {!playbackReady ? (
            <>
              <div className="no-track-icon connecting">🎵</div>
              <div className="no-track-text">Connecting to Spotify...</div>
              <div className="no-track-hint">Please wait</div>
            </>
          ) : playbackError ? (
            <>
              <div className="no-track-icon error">⚠️</div>
              <div className="no-track-text">{getErrorMessage(playbackError)}</div>
              <div className="no-track-hint">{playbackError}</div>
            </>
          ) : (
            <>
              <div className="no-track-icon">♫</div>
              <div className="no-track-text">No track selected</div>
              <div className="no-track-hint">Select a song to play</div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="now-playing-screen">
      <div className="now-playing-header">Now Playing</div>

      {playbackError && (
        <div className="error-banner">
          {getErrorMessage(playbackError)}
        </div>
      )}

      <div className="album-art">
        {track.albumArt ? (
          <img
            src={track.albumArt}
            alt={track.album}
            className="album-art-image"
          />
        ) : (
          <div className="album-art-placeholder">♫</div>
        )}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>

      <div className="track-info">
        <div className="track-title">{track.title}</div>
        <div className="track-artist">{track.artist}</div>
      </div>

      <div className="progress-section">
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
        <div className="time-display">
          <span>{formatTime(currentProgress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="playback-controls">
        <button
          className={`control-btn shuffle-btn ${shuffleEnabled ? 'active' : ''}`}
          onClick={onToggleShuffle}
          aria-label={shuffleEnabled ? 'Shuffle on' : 'Shuffle off'}
          title={shuffleEnabled ? 'Shuffle: On' : 'Shuffle: Off'}
        >
          🔀
        </button>

        <button
          className="play-btn"
          onClick={onPlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <span className="loading-icon">⏳</span>
          ) : isPlaying ? (
            '⏸'
          ) : (
            '▶'
          )}
        </button>

        <button
          className={`control-btn repeat-btn ${repeatMode !== 'off' ? 'active' : ''}`}
          onClick={onCycleRepeatMode}
          aria-label={`Repeat: ${getRepeatLabel()}`}
          title={`Repeat: ${getRepeatLabel()}`}
        >
          {getRepeatIcon()}
        </button>
      </div>

      <div className="volume-section">
        <span className="volume-icon">🔈</span>
        <div className="volume-bar">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="volume-slider"
            aria-label="Volume"
          />
          <div className="volume-fill" style={{ width: `${volume}%` }}></div>
        </div>
        <span className="volume-icon">🔊</span>
      </div>
    </div>
  )
}

export default NowPlayingScreen
