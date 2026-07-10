<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite 5" />
  <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express 4" />
  <img src="https://img.shields.io/badge/Spotify-Web%20API-1DB954?logo=spotify&logoColor=white" alt="Spotify Web API" />
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License" />
</p>

# 🎵 PixelPod

**An iPod Classic–inspired web music player powered by Spotify.**

PixelPod recreates the nostalgic iPod Classic experience in the browser — complete with a rotary click wheel, screen transitions, and tactile audio feedback — while streaming your real Spotify library. Browse playlists, liked songs, and the Spotify catalog through a pixel-perfect retro interface that responds to both mouse and keyboard input.

> **Requires Spotify Premium** for full playback. Free accounts can authenticate, browse, and search.

---

## ✨ Features

- **Click Wheel Navigation** — Drag the circular wheel to scroll; press directional buttons and the center button to navigate, just like the real thing.
- **Spotify Integration** — OAuth 2.0 + PKCE login, playlist browsing, liked songs, and catalog search.
- **Web Playback SDK** — Stream music directly in the browser via the Spotify Web Playback SDK.
- **Shuffle & Repeat** — Full shuffle/repeat controls with local queue management for liked songs.
- **Themes & Skins** — Switch between *Classic* and *Modern* screen themes, and *Silver*, *Graphite*, or *Blue* iPod skins.
- **Audio Feedback** — Synthesized click, select, and back sounds via the Web Audio API.
- **Keyboard Shortcuts** — Arrow keys, Enter, Escape, Space, `S` (shuffle), `R` (repeat), `M` (mute), `+`/`-` (volume).
- **Responsive & Accessible** — Works on all screen sizes; respects `prefers-reduced-motion`.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 (Vite 5, ES Modules) |
| **Styling** | Vanilla CSS with CSS Custom Properties (design-token architecture) |
| **Backend / Auth Server** | Node.js + Express 4 |
| **Music Streaming** | Spotify Web API + Spotify Web Playback SDK |
| **Auth Flow** | OAuth 2.0 Authorization Code with PKCE (server-managed verifiers) |
| **HTTP Client** | `fetch` (browser) / `axios` (server) |
| **Testing** | Vitest + React Testing Library + jsdom |
| **Build Tool** | Vite 5 with manual chunk splitting |
| **Dev Tooling** | Concurrently (parallel dev servers), dotenv |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
│                                                                 │
│  ┌──────────┐    ┌───────────┐    ┌──────────────────────────┐  │
│  │  App.jsx  │◄──►│  Contexts  │◄──►│  Services / Utils        │  │
│  │ (State +  │    │ Auth       │    │ authService.js           │  │
│  │  Routing) │    │ Spotify    │    │ spotifyService.js        │  │
│  └─────┬─────┘    │ Playback   │    │ playbackService.js       │  │
│        │         └───────────┘    │ spotifyAuth.js            │  │
│        ▼                          │ spotifyApi.js             │  │
│  ┌──────────┐                     └──────────┬───────────────┘  │
│  │  IPod     │                                │                  │
│  │ ├ Screen  │                                │                  │
│  │ └ Wheel   │                                │                  │
│  └──────────┘                                │                  │
│        │                                      │                  │
└────────┼──────────────────────────────────────┼──────────────────┘
         │  Renders Screens                     │  HTTPS
         ▼                                      ▼
  ┌────────────────┐                 ┌─────────────────────┐
  │ Boot / Login   │                 │  Express Auth Server │
  │ Menu / Search  │                 │  /api/auth/login     │
  │ NowPlaying     │                 │  /api/auth/token     │
  │ Settings       │                 │  /api/auth/refresh   │
  └────────────────┘                 └──────────┬──────────┘
                                                │
                                                ▼
                                     ┌─────────────────────┐
                                     │  Spotify Accounts    │
                                     │  & Web API           │
                                     └─────────────────────┘
```

### Data Flow

1. **Authentication** — The user clicks "Connect Spotify". The frontend requests `/api/auth/login` from the Express server, which generates a PKCE code verifier/challenge pair, stores the verifier in memory, and returns the Spotify authorization URL. After the user authorizes, the callback hits `/api/auth/token` to exchange the code for tokens.

2. **Library Browsing** — Authenticated API calls go through `spotifyApi.js → fetchWithAuth()`, which attaches the current access token, handles 401/403 errors with automatic token refresh, and surfaces user-friendly error messages.

3. **Playback** — The Spotify Web Playback SDK is initialized as a browser-side player device. `PlaybackContext` manages device registration, state sync (progress, shuffle, repeat), and delegates play/pause/seek commands through `playbackService.js`.

4. **Navigation** — `App.jsx` acts as a state machine, managing screen transitions via a `menuHistory` stack. The `Screen` component applies CSS slide animations, and `ClickWheel` converts circular mouse drag into scroll events via angular velocity tracking.

---

## 📂 Project Structure

```
pixelpod/
├── server/
│   └── index.js              # Express auth server (PKCE, token exchange, CORS)
├── src/
│   ├── components/            # UI building blocks (IPod, Screen, ClickWheel, ErrorBoundary)
│   ├── screens/               # Full-screen views (Boot, Login, Menu, NowPlaying, Search, Settings)
│   ├── context/               # React Contexts (Auth, Spotify data, Playback)
│   ├── hooks/                 # Custom hooks (navigation, queue, wheel input, keyboard, debounce)
│   ├── services/              # Business logic layer (auth, spotify, playback)
│   ├── utils/                 # Low-level utilities (API wrappers, token management, sounds, logger)
│   └── __tests__/             # Integration and unit tests
├── .env.example               # Environment variable template
├── vite.config.js             # Vite + Vitest configuration
├── eslint.config.js           # ESLint flat config (React + hooks)
├── .prettierrc                # Prettier formatting rules
├── SETUP.md                   # Detailed Spotify developer setup guide
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Spotify Developer** account ([developer.spotify.com/dashboard](https://developer.spotify.com/dashboard))
- A **Spotify Premium** subscription (required for in-browser playback)

### 1. Clone the Repository

```bash
git clone https://github.com/DevAbduIIah/PixelPod.git
cd PixelPod
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Click **Create App** and fill in:
   - **App name**: `PixelPod`
   - **Redirect URI**: `http://127.0.0.1:5174/callback`
   - Enable **Web API** and **Web Playback SDK**.
3. Save and copy your **Client ID** and **Client Secret**.

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://127.0.0.1:5174/callback
PORT=3001
```

> See [SETUP.md](SETUP.md) for optional environment variables and production deployment.

### 5. Run the App

```bash
npm run dev:full
```

This starts both the Express auth server (port 3001) and the Vite dev server (port 5174) concurrently. Open [http://127.0.0.1:5174](http://127.0.0.1:5174) in your browser.

### 6. Run Tests

```bash
npm test           # Watch mode
npm run test:run   # Single run
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `↑` / `↓` | Navigate menu items |
| `Enter` | Select / Confirm |
| `Escape` | Go back |
| `Space` | Play / Pause |
| `←` / `→` | Skip back / forward |
| `S` | Toggle shuffle |
| `R` | Cycle repeat mode |
| `+` / `-` | Volume up / down |
| `M` | Mute / unmute |

---

## 🗺 Future Roadmap

- [ ] **Album Browsing** — Navigate and play full albums from search results.
- [ ] **Artist Pages** — View top tracks and discography for individual artists.
- [ ] **Queue Management** — View, reorder, and clear the upcoming queue from a dedicated screen.
- [ ] **Recently Played** — Surface recently played tracks (API endpoint already exists in `spotifyApi.js`).
- [ ] **Touch / Mobile Support** — Implement touch-based wheel gestures for mobile browsers.
- [ ] **PWA Support** — Add a service worker and manifest for installable, offline-capable experience.
- [ ] **Accessibility Audit** — Full ARIA labeling, screen reader announcements, and focus management.
- [ ] **End-to-End Tests** — Playwright or Cypress tests for critical user flows (login, playback, navigation).
- [ ] **CI/CD Pipeline** — GitHub Actions workflow for linting, testing, and deployment.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <sub>Built with 🎧 and nostalgia.</sub>
</p>
