import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { AuthProvider } from './context/AuthContext'
import { SpotifyProvider } from './context/SpotifyContext'
import { PlaybackProvider } from './context/PlaybackContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <PlaybackProvider>
          <SpotifyProvider>
            <App />
          </SpotifyProvider>
        </PlaybackProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
