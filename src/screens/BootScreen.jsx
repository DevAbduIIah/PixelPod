import './BootScreen.css'

function BootScreen() {
  return (
    <div className="boot-screen" aria-label="PixelPod boot screen">
      <div className="boot-mark">
        <div className="pixel-logo">PIXEL</div>
        <div className="boot-text">POD</div>
      </div>
      <div className="boot-caption">Loading Spotify library</div>
      <div className="loading-bar" aria-hidden="true">
        <div className="loading-progress"></div>
      </div>
    </div>
  )
}

export default BootScreen
