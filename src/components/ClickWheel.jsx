import { useState } from 'react'
import './ClickWheel.css'

function ClickWheel({ onSelect, onBack, onNext, onPrevious, onPlayPause, onSkipForward, onSkipBack }) {
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [lastAngle, setLastAngle] = useState(0)

  const handleMouseDown = (e) => {
    setIsDragging(true)
    const angle = getAngle(e)
    setLastAngle(angle)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return

    const angle = getAngle(e)
    const delta = angle - lastAngle

    // Normalize delta
    let normalizedDelta = delta
    if (delta > 180) normalizedDelta = delta - 360
    if (delta < -180) normalizedDelta = delta + 360

    setRotation(prev => prev + normalizedDelta)

    // Trigger scroll based on rotation
    if (Math.abs(normalizedDelta) > 15) {
      if (normalizedDelta > 0) {
        onNext()
      } else {
        onPrevious()
      }
    }

    setLastAngle(angle)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const getAngle = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
    return angle
  }

  return (
    <div className="click-wheel">
      <div
        className="wheel-outer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="wheel-inner">
          <button className="center-button" onClick={onSelect}>
            SELECT
          </button>
        </div>

        <button className="wheel-button top" onClick={onBack}>
          MENU
        </button>
        <button className="wheel-button right" onClick={onSkipForward}>
          ⏭
        </button>
        <button className="wheel-button bottom" onClick={onPlayPause}>
          ⏯
        </button>
        <button className="wheel-button left" onClick={onSkipBack}>
          ⏮
        </button>
      </div>
    </div>
  )
}

export default ClickWheel
