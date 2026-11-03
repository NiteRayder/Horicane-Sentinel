# Horicane Sentinel

**The secure management dashboard for Horicane**, by Horizon Forge Studios.

Horicane Sentinel is a separate web application for managing Horicane Discord servers. This repository contains the dashboard UI and a server-side authentication/API foundation. It does not contain the Horicane bot itself.

## Current starter capabilities

- Responsive black, white, and silver dashboard UI
- Discord OAuth2 sign-in handled on the server
- Session-backed identity and logout
- Server list fetched from Discord on the server, filtered to servers where the signed-in user has Manage Server or Administrator permissions
- Security headers, rate limiting, environment validation, linting, and tests
- A clearly isolated integration boundary for connecting to Horicane's future/available management API

**Important:** This is a foundation, not a finished production dashboard. Server-management actions, bot-presence verification, moderation cases, audit-log streaming, role/channel editing, and automation controls must not be considered functional until connected to a trusted Horicane API and tested end to end.

## Requirements

- Node.js 22.12 or newer
- A Discord application with OAuth2 configured
- npm

## Local setup

1. Copy `.env.example` to `.env`.
2. In the Discord Developer Portal, add the exact callback URL shown in `DISCORD_REDIRECT_URI` to OAuth2 Redirects.
3. Set `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and a long random `SESSION_SECRET`.
4. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For local development, use `http://localhost:3000/auth/discord/callback` as the redirect URI. For deployment, use HTTPS and the exact public callback URL.

## Environment variables

See `.env.example`. Never commit `.env`, OAuth client secrets, session secrets, bot tokens, or API credentials.

## Architecture

- `src/server/`: Express app, Discord OAuth, session handling, and API routes
- `src/client/`: React + Vite dashboard
- `src/server/integrations/horicane.js`: server-only adapter boundary for the bot's management API

The browser must never receive a Discord client secret, bot token, session secret, or private service credential. Do not call privileged bot APIs directly from the browser.

## Horicane API integration

Horicane exposes a versioned, read-only API for health and server overviews. Configure `HORICANE_API_BASE_URL` and a strong `HORICANE_API_TOKEN` in Sentinel; configure the same token in the bot. The API should be reachable only through localhost or a private HTTPS connection. The adapter remains fail-closed when configuration is missing. Sentinel rechecks the user's current Discord permissions for every guild overview request, and Horicane independently verifies its own guild access. The browser never receives the service token. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the v1 contract.

## Scripts

- `npm run dev`: run the API and Vite dev server
- `npm run build`: build the frontend
- `npm start`: run the production server
- `npm run lint`: lint source files
- `npm test`: run tests

## Deployment checklist

- Use HTTPS and secure cookies.
- Set a strong, unique `SESSION_SECRET`.
- Configure the exact production OAuth callback URL.
- Configure a persistent, production-grade session store. The default in-memory session store is for local development only.
- Configure trusted proxy settings only for your actual hosting topology.
- Add a trusted Horicane API and enforce guild-level authorization server-side.
- Review OAuth scopes and request only what the features actually need.
- Configure monitoring, backups, and a security contact.

## License

Proprietary. All rights reserved. See [LICENSE](LICENSE).
