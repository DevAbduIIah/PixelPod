import { useWheelInput } from '@/hooks/useWheelInput'
import './ClickWheel.css'

function ClickWheel({ onSelect, onBack, onNext, onPrevious, onPlayPause, onSkipForward, onSkipBack }) {
  const { wheelHandlers } = useWheelInput({ onNext, onPrevious })

  return (
    <div className="click-wheel">
      <div
        className="wheel-outer"
        {...wheelHandlers}
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
          {'>>'}
        </button>
        <button className="wheel-button bottom" onClick={onPlayPause}>
          PLAY
        </button>
        <button className="wheel-button left" onClick={onSkipBack}>
          {'<<'}
        </button>
      </div>
    </div>
  )
}

export default ClickWheel
