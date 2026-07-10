import { Component } from 'react'
import { logger } from '@/utils/logger'
import './ErrorBoundary.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-shell">
            <div className="error-boundary-screen">
              <div className="error-boundary-icon">⚠</div>
              <h1 className="error-boundary-title">Something went wrong</h1>
              <p className="error-boundary-message">
                PixelPod hit an unexpected error and needs to restart.
              </p>
              <button
                className="error-boundary-button"
                onClick={this.handleReload}
              >
                ↻ Refresh
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
