# PixelPod

PixelPod is an iPod-inspired Spotify player built with React, Vite, and Express. It recreates the feel of navigating music on a classic click-wheel device while using Spotify for authentication, library access, search, and playback.

The app includes a custom iPod-style interface, Spotify OAuth login, playlist browsing, liked songs, track search, and in-browser playback through the Spotify Web Playback SDK.

## Features

- iPod-inspired UI with a custom screen and click wheel
- Spotify login flow with PKCE-based authentication
- Browse your Spotify playlists
- Open and play tracks from playlists
- View and play your liked songs
- Search Spotify tracks from the app
- Now Playing screen with album art and playback progress
- Keyboard support for navigating the click-wheel interface

## Tech Stack

- React 18
- Vite
- Express
- Spotify Web API
- Spotify Web Playback SDK

## Project Structure

```text
.
|-- server/              # Express auth server for Spotify OAuth
|-- src/
|   |-- components/      # iPod shell, screen, and click wheel
|   |-- context/         # Auth, Spotify data, and playback state
|   |-- screens/         # Boot, login, menu, search, now playing views
|   `-- utils/           # Spotify auth and API helpers
|-- .env.example
|-- package.json
|-- SETUP.md
`-- vite.config.js
```

## Requirements

- Node.js 18+
- npm
- A Spotify Developer app
- A Spotify Premium account for full playback support

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, you can use:

```powershell
Copy-Item .env.example .env
```

3. Fill in your Spotify app credentials in `.env`:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://127.0.0.1:5174/callback
PORT=3001
```

Optional frontend overrides:

```env
# Leave empty to use the Vite proxy during local development
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://127.0.0.1:3001
```

4. Start the frontend and backend together:

```bash
npm run dev:full
```

5. Open the app at:

```text
http://127.0.0.1:5174
```

## Spotify App Setup

Create a Spotify app in the Spotify Developer Dashboard and configure it with:

- Redirect URI: `http://127.0.0.1:5174/callback`
- Required use case: Spotify Web API
- Playback note: browser playback relies on the Spotify Web Playback SDK

After creating the app, copy the Client ID and Client Secret into your local `.env` file.

## Available Scripts

- `npm run dev` starts the Vite frontend on `127.0.0.1:5174`
- `npm run server` starts the Express auth server on port `3001`
- `npm run dev:full` runs both frontend and backend together
- `npm run build` creates a production frontend build
- `npm run preview` previews the Vite production build

When running only the frontend dev server, `/api/*` requests are proxied to `http://127.0.0.1:3001` by Vite.

## Controls

PixelPod supports both the on-screen click wheel and keyboard input.

- `ArrowUp` / `ArrowDown`: move through menus and search results
- `Enter`: select
- `Escape`: go back
- `Space`: play or pause on the Now Playing screen
- Mouse drag on the wheel: simulate click-wheel scrolling
- Wheel buttons: `MENU`, `SELECT`, previous, next, play/pause

## How It Works

- The Express server handles Spotify OAuth token exchange and refresh.
- The React app stores tokens in local storage after login.
- Spotify data such as playlists, liked songs, and search results is fetched from the Spotify Web API.
- Playback is handled in the browser using the Spotify Web Playback SDK and an active Spotify device session.

## Notes and Limitations

- Full playback requires Spotify Premium.
- The backend server must be running for login and token refresh to work.
- The app is currently configured for local development.
- `.env`, `node_modules`, and build output are ignored by Git and should not be committed.

## Future Improvements

- Better mobile touch support for wheel rotation
- Playlist artwork and richer list views
- Volume controls and scrubbing
- Better error states around playback device availability
- Deployment-ready production configuration
