import { useAuth } from '../context/AuthContext'
import './LoginScreen.css'

function LoginScreen() {
  const { login, isLoading, error } = useAuth()

  const getLoginState = () => {
    if (!error) return null

    const normalizedError = error.toLowerCase()

    if (normalizedError.includes('expired')) {
      return {
        title: 'Login Expired',
        detail: 'Press SELECT to connect Spotify again.'
      }
    }

    if (normalizedError.includes('server') || normalizedError.includes('reach')) {
      return {
        title: 'Server Unavailable',
        detail: 'Start the PixelPod server and try again.'
      }
    }

    return {
      title: 'Login Unavailable',
      detail: error
    }
  }

  const loginState = getLoginState()

  return (
    <div className="login-screen" aria-busy={isLoading}>
      <div className="login-header">
        <div className="spotify-icon">PP</div>
        <div className="login-title">Connect Spotify</div>
      </div>

      <div className="login-body">
        <div className="login-description">
          Link your Spotify account to play music on PixelPod.
        </div>

        {loginState && (
          <div className="login-error">
            <div className="login-error-title">{loginState.title}</div>
            <div className="login-error-copy">{loginState.detail}</div>
          </div>
        )}

        <button
          className="login-button"
          onClick={login}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="button-icon">Sync</span>
              <span className="loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </>
          ) : (
            <>
              <span className="button-icon">Play</span>
              <span>Login with Spotify</span>
            </>
          )}
        </button>
      </div>

      <div className="login-footer">
        {isLoading ? 'Opening Spotify authorization...' : 'Press SELECT to connect'}
      </div>
    </div>
  )
}

export default LoginScreen
