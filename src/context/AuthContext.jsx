import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getStoredTokens,
  getValidToken,
  exchangeCodeForToken,
  clearTokens,
  initiateLogin
} from '../utils/spotifyAuth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getValidToken()
        if (token) {
          setIsAuthenticated(true)
          await fetchUserProfile(token)
        }
      } catch (err) {
        console.error('Auth check failed:', err)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      const error = params.get('error')

      if (error) {
        setError(`Spotify authorization failed: ${error}`)
        setIsLoading(false)
        // Clean URL
        window.history.replaceState({}, document.title, '/')
        return
      }

      if (code && state) {
        setIsLoading(true)
        try {
          await exchangeCodeForToken(code, state)
          setIsAuthenticated(true)
          const token = await getValidToken()
          if (token) {
            await fetchUserProfile(token)
          }
        } catch (err) {
          console.error('Token exchange failed:', err)
          setError(err.message)
        } finally {
          setIsLoading(false)
          // Clean URL
          window.history.replaceState({}, document.title, '/')
        }
      }
    }

    handleCallback()
  }, [])

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
    }
  }

  const login = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await initiateLogin()
    } catch (err) {
      setError('Failed to initiate login')
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setIsAuthenticated(false)
    setUser(null)
  }, [])

  const value = {
    isAuthenticated,
    isLoading,
    error,
    user,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
