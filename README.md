PixelPod — iPod-Inspired Spotify Web Player
Role

You are a senior full-stack engineer and creative UI developer. Your job is to design and implement a visually unique, pixel-art, iPod-inspired web music player that integrates with Spotify. You must follow the phases defined in this document strictly and build the project incrementally, ensuring each phase is complete and functional before moving to the next.

You are expected to make strong design and architectural decisions while keeping the code clean, modular, and maintainable.

Project Goal

Build a pixel-art iPod-style music player that connects to Spotify, allowing users to:

Log in with Spotify

Browse music (playlists, tracks, search)

Play music inside a retro iPod UI

Control playback (play/pause/next/previous)

View album art and track info in a stylized interface

The final product should feel like a real nostalgic device recreated in the browser, not just a music app with a skin.

General Requirements

Follow the phases strictly (do not skip ahead)

Keep the project runnable after each phase

Prioritize clean architecture and readability

Avoid unnecessary complexity

Make reasonable decisions when not specified

UI quality is very important

The design should feel like a real product

Keep components modular and reusable

Avoid large monolithic files

Ensure responsiveness where reasonable

Use modern web development best practices

Product Scope
Core Features

Spotify authentication

Pixel-art iPod UI

Menu navigation system

Playlist and track browsing

Now Playing screen

Playback controls

Real-time playback state syncing

Out of Scope (for now)

Social features

File uploads

Multi-user systems

Backend-heavy analytics

Complex recommendation systems

Phase 1 — Pixel iPod UI (No Spotify Yet)
Objective

Build a fully interactive pixel-art iPod interface using mock data.

Requirements
UI Components

iPod device shell

Screen area (top section)

Click wheel (bottom section)

Center button + directional inputs

Screens

Boot screen (optional but encouraged)

Main menu:

Music

Now Playing

Settings (placeholder)

Music submenu:

Playlists

Songs

Interaction

Navigation using:

Mouse (click wheel simulation)

Keyboard (arrow keys + enter)

Menu transitions should feel smooth

Highlight selected menu item

Maintain navigation state

Now Playing Screen (Mock)

Song title

Artist

Album art (placeholder)

Progress bar (fake animation)

Play/pause icon

Design Requirements

Pixel-style UI (fonts, borders, icons)

Retro color palette

Clean spacing and alignment

Subtle animations (screen transitions, selection changes)

Stop Condition

UI looks like a real iPod interface

Navigation works across menus

Now Playing screen works with mock data

No real Spotify integration yet

Output

Code implementation

Summary of UI structure and components

Instructions to run the app

Phase 2 — Spotify Authentication
Objective

Allow users to log in with their Spotify account securely.

Requirements
Features

Spotify OAuth login

Redirect to Spotify login page

Handle callback and authorization code

Exchange code for access token

Store tokens securely (session or backend)

Technical Expectations

Do not expose client secrets in frontend

Use a backend if needed for token exchange

Handle token expiration and refresh

Store authentication state properly

UI Integration

Add “Connect to Spotify” screen

Show login button

Redirect authenticated users into the app

Handle loading and error states cleanly

Stop Condition

User can log in with Spotify

Access token is retrieved and usable

App recognizes authenticated user

No music data or playback yet

Output

Code implementation

Explanation of auth flow

Setup instructions (Spotify app credentials)

Phase 3 — Fetching Real Spotify Data
Objective

Replace mock data with real Spotify data.

Requirements
Features

Fetch user playlists

Fetch tracks inside playlists

Fetch basic user profile info

Implement search for tracks/artists

UI Integration

Replace mock menu data with real data:

Playlists list

Songs list

Display:

Track name

Artist

Album art

Behavior

Selecting a playlist shows its tracks

Selecting a track prepares it for playback (no playback yet)

Loading states should be handled properly

Technical Expectations

Use Spotify Web API endpoints

Handle API errors gracefully

Avoid unnecessary re-fetching

Keep data flow clean

Stop Condition

Real playlists are displayed

Tracks load correctly

Navigation works with real data

No playback yet

Output

Code implementation

Summary of API usage

Notes on data flow

Phase 4 — Spotify Playback Integration
Objective

Enable actual music playback using Spotify.

Requirements
Features

Integrate Spotify Web Playback SDK

Initialize player in browser

Transfer playback to this device

Play selected track

Play/pause functionality

Next/previous track

UI Integration

Now Playing screen should show:

Current track

Artist

Album art

Playback progress

Progress bar should reflect real playback

Play/pause icon updates dynamically

Behavior

Clicking a track starts playback

Playback state stays in sync

Handle edge cases (no active device, etc.)

Technical Expectations

Manage player state correctly

Avoid duplicate playback triggers

Handle SDK readiness properly

Keep frontend and Spotify state aligned

Stop Condition

Music plays inside the app

Controls work (play/pause/next/previous)

UI reflects real playback state

No major sync issues

Output

Code implementation

Explanation of playback flow

Notes on SDK usage

Phase 5 — Polish and “iPod Feel”
Objective

Make the app feel like a real nostalgic device.

Requirements
UI/UX Improvements

Smooth screen transitions

Click wheel rotation animation

Better pixel styling

Improved typography

Refined spacing and layout

Interaction Enhancements

Scroll acceleration effect (like iPod wheel)

Sound effects (click sounds)

Better keyboard mapping

Visual Effects

Optional CRT/pixel filter

Boot animation

Screen glow or shadow

Subtle motion effects

UX Improvements

Loading indicators

Error messages

Empty states

Disabled states

Optional Enhancements

Volume control

Recently played

Favorites

Theme switching (classic / dark / neon)

Stop Condition

App feels polished and unique

UI/UX is smooth and consistent

Strong “iPod-like” experience

Portfolio-ready quality

Output

Code implementation

Summary of improvements

List of added enhancements

Technical Freedom

You may choose the exact tools and stack, but prefer:

Modern frontend frameworks

Clean state management

Maintainable architecture

Avoid over-engineering.

Code Quality Rules

Small, focused components

Clear naming conventions

No unused code

Logical file structure

Separation of concerns

Testing Rules

After each phase:

Ensure app runs without errors

Ensure previous functionality still works

Fix obvious issues before continuing

Reasoning Rules

Think step-by-step before coding

Respect phase boundaries

Choose practical solutions

Avoid unnecessary questions

Prioritize working features over perfection

Final Goal

A visually stunning, pixel-art, iPod-style Spotify player that:

Works smoothly

Uses real Spotify data

Plays music

Feels like a real product

Is impressive enough for a portfolio
