import { useState, useEffect, useRef } from 'react'

function getPointerAngle(target, event) {
  const rect = target.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  return Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI)
}

export function useWheelInput({ onNext, onPrevious }) {
  const [isDragging, setIsDragging] = useState(false)
  const [velocity, setVelocity] = useState(0)
  const lastAngleRef = useRef(0)
  const lastTimeRef = useRef(Date.now())
  const momentumRef = useRef(null)
  const rotationThresholdRef = useRef(0)

  useEffect(() => {
    if (!isDragging && Math.abs(velocity) > 0.5) {
      momentumRef.current = setInterval(() => {
        setVelocity((currentVelocity) => {
          const nextVelocity = currentVelocity * 0.92
          rotationThresholdRef.current += Math.abs(nextVelocity)

          if (rotationThresholdRef.current > 12) {
            if (nextVelocity > 0) {
              onNext?.()
            } else if (nextVelocity < 0) {
              onPrevious?.()
            }
            rotationThresholdRef.current = 0
          }

          if (Math.abs(nextVelocity) < 0.5) {
            if (momentumRef.current) {
              clearInterval(momentumRef.current)
              momentumRef.current = null
            }
            return 0
          }

          return nextVelocity
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

  const handleMouseDown = (event) => {
    setIsDragging(true)
    setVelocity(0)
    rotationThresholdRef.current = 0
    lastAngleRef.current = getPointerAngle(event.currentTarget, event)
    lastTimeRef.current = Date.now()

    if (momentumRef.current) {
      clearInterval(momentumRef.current)
      momentumRef.current = null
    }
  }

  const handleMouseMove = (event) => {
    if (!isDragging) return

    const angle = getPointerAngle(event.currentTarget, event)
    const delta = angle - lastAngleRef.current
    const now = Date.now()
    const timeDelta = now - lastTimeRef.current

    let normalizedDelta = delta
    if (delta > 180) normalizedDelta = delta - 360
    if (delta < -180) normalizedDelta = delta + 360

    if (timeDelta > 0) {
      setVelocity(normalizedDelta / Math.max(timeDelta, 1))
    }

    const speed = Math.abs(normalizedDelta)
    let threshold = 15

    if (speed > 30) threshold = 10
    else if (speed > 20) threshold = 12

    if (Math.abs(normalizedDelta) > threshold) {
      if (normalizedDelta > 0) {
        onNext?.()
      } else {
        onPrevious?.()
      }
    }

    lastAngleRef.current = angle
    lastTimeRef.current = now
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return {
    isDragging,
    wheelHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp
    }
  }
}

