import { useState, useEffect, useRef } from 'react'
import './ClickWheel.css'

function ClickWheel({ onSelect, onBack, onNext, onPrevious, onPlayPause, onSkipForward, onSkipBack }) {
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [lastAngle, setLastAngle] = useState(0)
  const [velocity, setVelocity] = useState(0)
  const lastTimeRef = useRef(Date.now())
  const momentumRef = useRef(null)
  const rotationThresholdRef = useRef(0)

  // Momentum scrolling effect
  useEffect(() => {
    if (!isDragging && Math.abs(velocity) > 0.5) {
      momentumRef.current = setInterval(() => {
        setVelocity((v) => {
          const newVelocity = v * 0.92 // Friction factor

          // Accumulate rotation
          rotationThresholdRef.current += Math.abs(newVelocity)

          // Trigger scroll when threshold is reached
          if (rotationThresholdRef.current > 12) {
            if (newVelocity > 0) {
              onNext()
            } else if (newVelocity < 0) {
              onPrevious()
            }
            rotationThresholdRef.current = 0
          }

          // Stop when velocity is too low
          if (Math.abs(newVelocity) < 0.5) {
            if (momentumRef.current) {
              clearInterval(momentumRef.current)
              momentumRef.current = null
            }
            return 0
          }

          return newVelocity
        })
      }, 50)
    }

    return () => {
      if (momentumRef.current) {
        clearInterval(momentumRef.current)
        momentumRef.current = null
      }
    }
  }, [isDragging, velocity, onNext, onPrevious])

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setVelocity(0)
    rotationThresholdRef.current = 0
    const angle = getAngle(e)
    setLastAngle(angle)
    lastTimeRef.current = Date.now()

    // Clear any momentum
    if (momentumRef.current) {
      clearInterval(momentumRef.current)
      momentumRef.current = null
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return

    const angle = getAngle(e)
    const delta = angle - lastAngle
    const now = Date.now()
    const timeDelta = now - lastTimeRef.current

    // Normalize delta
    let normalizedDelta = delta
    if (delta > 180) normalizedDelta = delta - 360
    if (delta < -180) normalizedDelta = delta + 360

    setRotation(prev => prev + normalizedDelta)

    // Calculate velocity (degrees per millisecond)
    if (timeDelta > 0) {
      setVelocity(normalizedDelta / Math.max(timeDelta, 1))
    }

    // Improved scroll detection with acceleration
    const speed = Math.abs(normalizedDelta)
    let threshold = 15

    // Lower threshold for faster movements (more responsive)
    if (speed > 30) threshold = 10
    else if (speed > 20) threshold = 12

    if (Math.abs(normalizedDelta) > threshold) {
      if (normalizedDelta > 0) {
        onNext()
      } else {
        onPrevious()
      }
    }

    setLastAngle(angle)
    lastTimeRef.current = now
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
