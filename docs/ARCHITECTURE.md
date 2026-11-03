# Architecture

Horicane Sentinel is intentionally separate from the Horicane bot repository.

## Request flow

1. The browser sends the user to `/auth/discord`.
2. Discord OAuth2 returns to the server callback.
3. Passport stores the authenticated identity and OAuth access token in the server-side session.
4. The browser calls same-origin `/api/*` endpoints using its HTTP-only session cookie.
5. Sentinel fetches the user's current Discord guild permissions.
6. Only after confirming Manage Server or Administrator access, Sentinel calls Horicane's versioned API over a server-to-server connection.

## Trust boundaries

- Browser: presentation and user interaction only. It is not trusted to enforce authorization.
- Sentinel server: owns OAuth secrets, session handling, and the shared Horicane API token.
- Discord API: source for the user's current guild permissions, checked on every guild overview request.
- Horicane API: authenticates Sentinel's service token and independently fetches the guild with Horicane's bot credentials. It returns an overview only when the bot can access the guild.

The bearer token authenticates the Sentinel service; it does not replace the per-user Discord authorization check. Never send the service token or bot token to the browser.

## Horicane API v1 contract

Set `HORICANE_API_BASE_URL` to the private API origin (for example `http://127.0.0.1:3001` when both services run on one host) and set the same strong, unique `HORICANE_API_TOKEN` in both services.

Every request uses `Authorization: Bearer <HORICANE_API_TOKEN>` and receives `Cache-Control: no-store`.

- `GET /api/v1/health` — bot readiness, guild count, and process uptime.
- `GET /api/v1/guilds/:guildId/overview` — minimal guild details and bot identity/status.

Guild IDs must be Discord snowflakes. Horicane checks the bot's own Discord access for the requested guild. If the bot cannot access it, the overview returns `200` with `guild: null` and `bot.connected: false`. The API does not expose member lists, roles, channels, or user OAuth data. It is read-only; no moderation or configuration actions are exposed yet.

The bot API binds to loopback by default. If Sentinel runs on another host, use an HTTPS-protected private connection or authenticated tunnel and restrict ingress to Sentinel. Do not expose the API directly to the public internet.

## Session storage

Express's default MemoryStore is used by this starter for local development only. Before production, configure a persistent session store such as PostgreSQL, use HTTPS, and set the correct proxy configuration.
