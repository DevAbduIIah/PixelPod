# PixelPod Setup Guide

## Spotify Developer Setup

To use PixelPod with your Spotify account, you need to create a Spotify Developer application.

### Step 1: Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the details:
   - **App name**: PixelPod
   - **App description**: iPod-style Spotify player
   - **Redirect URI**: `http://localhost:5174/callback`
   - Check the boxes for Web API and Web Playback SDK
5. Click "Save"

### Step 2: Get Your Credentials

1. In your app dashboard, click "Settings"
2. Copy your **Client ID**
3. Click "View client secret" and copy your **Client Secret**

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   REDIRECT_URI=http://localhost:5174/callback
   PORT=3001
   ```

### Step 4: Run the Application

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the full application (backend + frontend):

   ```bash
   npm run dev:full
   ```

   Or run them separately:

   ```bash
   # Terminal 1 - Backend server
   npm run server

   # Terminal 2 - Frontend dev server
   npm run dev
   ```

3. Open your browser to `http://localhost:5174`

## Important Notes

### Spotify Premium Required

- The Spotify Web Playback SDK (used in Phase 4) requires a **Spotify Premium** subscription
- Basic browsing and authentication will work with a free account
- Full playback functionality requires Premium

### Development Mode

- Your Spotify app is in "Development Mode" by default
- Only users you explicitly add can use the app
- To add users: Dashboard → Users and Access → Add User

### Troubleshooting

**"Invalid redirect URI" error:**

- Make sure the redirect URI in your Spotify app settings exactly matches `http://localhost:5174/callback`
- Don't include trailing slashes

**"CORS error" in console:**

- Make sure the backend server is running on port 3001
- Check that your `.env` file has the correct values

**Token refresh fails:**

- Clear your browser's localStorage and try logging in again
- Check that your Client Secret is correct
