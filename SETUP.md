# PixelPod Setup Guide

## Spotify Developer Setup

To use PixelPod with your Spotify account, create a Spotify Developer application first.

### Step 1: Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **Create App**
4. Fill in the details:
   - **App name**: PixelPod
   - **App description**: iPod-style Spotify player
   - **Redirect URI**: `http://127.0.0.1:5174/callback`
   - Check the boxes for Web API and Web Playback SDK
5. Click **Save**

### Step 2: Get Your Credentials

1. Open your app dashboard and click **Settings**
2. Copy your **Client ID**
3. Click **View client secret** and copy your **Client Secret**

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Edit `.env` and add your credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://127.0.0.1:5174/callback
PORT=3001
```

Optional variables:

```env
# Restrict the auth server to a known frontend origin
FRONTEND_ORIGIN=http://127.0.0.1:5174

# Optional comma-separated extra origins for CORS
CORS_ORIGIN=

# Keep empty for same-origin requests. Vite proxies /api in local dev.
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://127.0.0.1:3001

# Prefer session-scoped Spotify tokens
VITE_TOKEN_STORAGE=session
```

### Step 4: Run the Application in Development

1. Install dependencies:

```bash
npm install
```

2. Start the backend and frontend together:

```bash
npm run dev:full
```

3. Open `http://127.0.0.1:5174`

You can also run them separately:

```bash
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

### Step 5: Run the Application in Production

1. Build the frontend:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

If `NODE_ENV=production` and `dist/` exists, the Express server can serve the built frontend and expose a health check at `/api/health`.

## Important Notes

### Spotify Premium Required

- The Spotify Web Playback SDK requires a Spotify Premium subscription
- Basic browsing and authentication still work with free accounts
- Full playback functionality requires Premium

### Development Mode

- Your Spotify app is in development mode by default
- Only users you explicitly add can use the app
- Add test users in Dashboard -> Users and Access -> Add User

## Troubleshooting

**Invalid redirect URI**

- Make sure the redirect URI in your Spotify app settings exactly matches `http://127.0.0.1:5174/callback`
- Do not include trailing slashes

**CORS error**

- Make sure the backend server is running on port `3001`
- Check that `FRONTEND_ORIGIN` and `CORS_ORIGIN` match the frontend you are using

**Token refresh fails**

- Clear your browser storage and log in again
- Check that your Client Secret is correct
