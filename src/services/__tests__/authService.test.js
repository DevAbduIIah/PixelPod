import {
  beginSpotifyLogin,
  clearAuthSession,
  completeAuthCallback,
  restoreAuthSession
} from '../authService'

const mockSpotifyAuth = vi.hoisted(() => ({
  getStoredTokens: vi.fn(),
  getValidToken: vi.fn(),
  exchangeCodeForToken: vi.fn(),
  clearTokens: vi.fn(),
  initiateLogin: vi.fn()
}))

vi.mock('../../utils/spotifyAuth', () => mockSpotifyAuth)

describe('authService', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('returns an expired-session message when stored tokens exist but no valid token can be restored', async () => {
    mockSpotifyAuth.getStoredTokens.mockReturnValue({ refresh_token: 'refresh-token' })
    mockSpotifyAuth.getValidToken.mockResolvedValue(null)

    await expect(restoreAuthSession()).resolves.toEqual({
      isAuthenticated: false,
      user: null,
      error: 'Login expired. Connect Spotify again.'
    })

    expect(fetch).not.toHaveBeenCalled()
  })

  it('restores the authenticated user profile when a valid token exists', async () => {
    mockSpotifyAuth.getStoredTokens.mockReturnValue(null)
    mockSpotifyAuth.getValidToken.mockResolvedValue('access-token')
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'user-1', display_name: 'Pixel Listener' })
    })

    await expect(restoreAuthSession()).resolves.toEqual({
      isAuthenticated: true,
      user: { id: 'user-1', display_name: 'Pixel Listener' },
      error: null
    })

    expect(fetch).toHaveBeenCalledWith('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: 'Bearer access-token'
      }
    })
  })

  it('completes the callback flow by exchanging the code and fetching the Spotify profile', async () => {
    mockSpotifyAuth.exchangeCodeForToken.mockResolvedValue(undefined)
    mockSpotifyAuth.getValidToken.mockResolvedValue('fresh-token')
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 'user-2', display_name: 'Fresh Session' })
    })

    await expect(completeAuthCallback('auth-code', 'callback-state')).resolves.toEqual({
      isAuthenticated: true,
      user: { id: 'user-2', display_name: 'Fresh Session' },
      error: null
    })

    expect(mockSpotifyAuth.exchangeCodeForToken).toHaveBeenCalledWith('auth-code', 'callback-state')
  })

  it('delegates login and logout actions to the auth utility layer', async () => {
    mockSpotifyAuth.initiateLogin.mockResolvedValue(undefined)

    await beginSpotifyLogin()
    clearAuthSession()

    expect(mockSpotifyAuth.initiateLogin).toHaveBeenCalledTimes(1)
    expect(mockSpotifyAuth.clearTokens).toHaveBeenCalledTimes(1)
  })
})
