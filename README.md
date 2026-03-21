# PixelPod

PixelPod is an iPod-inspired Spotify player built with React, Vite, and Express. It recreates the feel of a classic click-wheel music player while using Spotify for authentication, library browsing, search, and playback.

The app now includes a polished iPod-style shell, playlist and liked-song browsing, categorized search, a refined Now Playing screen, theme and skin switching, stronger error handling, a cleaner service-driven architecture, and automated tests.

## Highlights

- Classic iPod-style interface with a custom screen and click wheel
- Spotify OAuth login with PKCE
- Browse playlists and liked songs
- Search tracks, albums, and artists
- Playback controls with progress, seek, shuffle, repeat, and volume
- Theme and skin switching from Settings
- Keyboard navigation support alongside click-wheel controls
- Production-ready Express auth server with health check and optional static frontend serving
- Automated unit and integration tests with Vitest and Testing Library

## Tech Stack

- React 18
- Vite
- Express
- Spotify Web API
- Spotify Web Playback SDK
- Vitest
- Testing Library

## Project Structure

```text
.
|-- server/                 # Express auth server and production entrypoint
|-- src/
|   |-- components/         # iPod shell, screen, click wheel
|   |-- context/            # Auth, Spotify data, playback providers
|   |-- hooks/              # Reusable app hooks
|   |-- screens/            # Boot, login, menu, search, settings, now playing
|   |-- services/           # Auth, Spotify, playback service layer
|   |-- test/               # Shared test setup
|   `-- utils/              # Spotify helpers, sound helpers, logger
|-- .env.example
|-- SETUP.md
|-- package.json
`-- vite.config.js
```

## Requirements

- Node.js 18+
- npm
- A Spotify Developer app
- A Spotify Premium account for full playback support

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Fill in your Spotify app credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://127.0.0.1:5174/callback
PORT=3001
```

4. Start the app in development:

```bash
npm run dev:full
```

5. Open:

```text
http://127.0.0.1:5174
```

## Environment Variables

Required server variables:

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

# Optional comma-separated extra origins
CORS_ORIGIN=

# Leave empty for same-origin requests.
# In local dev, Vite proxies /api to VITE_API_PROXY_TARGET.
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://127.0.0.1:3001

# Defaults to local in development and session in production
VITE_TOKEN_STORAGE=session
```

## Available Scripts

- `npm run dev` starts the Vite frontend on `127.0.0.1:5174`
- `npm run server` starts the Express auth server on port `3001`
- `npm run dev:full` runs frontend and backend together
- `npm run build` builds the frontend into `dist/`
- `npm run preview` previews the production frontend build
- `npm start` starts the Express server and can serve `dist/`
- `npm run test` starts Vitest in watch mode
- `npm run test:run` runs the test suite once

## Spotify App Setup

Create a Spotify app in the Spotify Developer Dashboard and configure:

- Redirect URI: `http://127.0.0.1:5174/callback`
- Use case: Spotify Web API
- Playback note: browser playback uses the Spotify Web Playback SDK

After creating the app, copy the Client ID and Client Secret into `.env`.

## Controls

PixelPod supports both keyboard input and the on-screen wheel.

- `ArrowUp` / `ArrowDown`: move through menus and results
- `Enter`: select
- `Escape`: go back
- `Space`: play or pause on Now Playing
- `ArrowLeft` / `ArrowRight`: skip back or forward
- `S`: toggle shuffle
- `R`: cycle repeat mode
- `+` / `-`: raise or lower volume
- `M`: mute or restore volume
- Mouse drag on the wheel: simulate click-wheel scrolling

## Testing

The test suite covers both logic and user flow.

- Auth service behavior
- Playback service requests
- Spotify service pagination and mapping
- Utility formatter output
- App-level navigation into Settings and Now Playing

Run tests with:

```bash
npm run test:run
```

## Production Notes

- The Express server exposes `/api/health` for readiness checks.
- If `dist/` exists, the server can also serve the built frontend.
- Browser token storage defaults to `sessionStorage` in production to reduce token persistence.
- CORS can be restricted with `FRONTEND_ORIGIN` and `CORS_ORIGIN`.

Production flow:

```bash
npm run build
npm start
```

## How It Works

- The Express server handles Spotify OAuth code exchange and refresh.
- The React app stores Spotify tokens in browser storage and restores sessions on load.
- Spotify data is fetched through a service layer and exposed via React context.
- Playback is controlled in-browser through the Spotify Web Playback SDK.
- The iPod shell and screen system manage navigation, transitions, and click-wheel interactions.

## Notes

- Full playback requires Spotify Premium.
- The auth server must be running for login and token refresh unless you are serving the built app through `npm start`.
- `.env`, `node_modules`, and build output should not be committed.

More detailed setup and deployment notes are in [SETUP.md]
