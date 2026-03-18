import './NowPlayingScreen.css'

function NowPlayingScreen({ track, isPlaying, progress }) {
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!track) {
    return (
      <div className="now-playing-screen">
        <div className="now-playing-header">Now Playing</div>
        <div className="no-track">
          <div className="no-track-icon">♫</div>
          <div className="no-track-text">No track selected</div>
          <div className="no-track-hint">Select a song to play</div>
        </div>
      </div>
    )
  }

  const currentTime = Math.floor((progress / 100) * track.duration)
  const totalTime = track.duration

  return (
    <div className="now-playing-screen">
      <div className="now-playing-header">Now Playing</div>

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
      </div>

      <div className="track-info">
        <div className="track-title">{track.title}</div>
        <div className="track-artist">{track.artist}</div>
        <div className="track-album">{track.album}</div>
      </div>

      <div className="progress-section">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalTime)}</span>
        </div>
      </div>

      <div className="playback-controls">
        <div className="play-icon">
          {isPlaying ? '⏸' : '▶'}
        </div>
      </div>
    </div>
  )
}

export default NowPlayingScreen
