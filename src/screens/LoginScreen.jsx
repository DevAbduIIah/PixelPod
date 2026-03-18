import { useAuth } from '../context/AuthContext'
import './LoginScreen.css'

function LoginScreen() {
  const { login, isLoading, error } = useAuth()

  return (
    <div className="login-screen">
      <div className="login-header">
        <div className="spotify-icon">♫</div>
        <div className="login-title">Connect Spotify</div>
      </div>

      <div className="login-body">
        <div className="login-description">
          Link your Spotify account to play music on PixelPod
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <button
          className="login-button"
          onClick={login}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          ) : (
            <>
              <span className="button-icon">▶</span>
              <span>Login with Spotify</span>
            </>
          )}
        </button>
      </div>

      <div className="login-footer">
        Press SELECT to connect
      </div>
    </div>
  )
}

export default LoginScreen
