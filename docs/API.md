# Horicane Sentinel API

The API is a same-origin, session-authenticated dashboard API. It is intentionally read-only today; never treat the browser as an authorization boundary.

## Base URL and versioning

Use `/api/v1` for new clients. The unversioned `/api` mount remains as a temporary compatibility alias. Responses from the API use `Cache-Control: no-store`; errors use the existing `{ error, message }` envelope.

The machine-readable OpenAPI document is available at `GET /api/v1/openapi.json`. `GET /api/v1/capabilities` advertises available resources and integration readiness so clients can adapt without guessing which optional integration is configured.

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | None | API availability/version |
| GET | `/api/v1/capabilities` | None | Resource and operation discovery |
| GET | `/api/v1/me` | Discord session | Current signed-in user |
| GET | `/api/v1/guilds` | Discord session | Guilds where the user has Manage Server or Administrator permission |
| GET | `/api/v1/guilds/:guildId/overview` | Discord session | Overview after server-side permission verification |

The overview is read-only. The server verifies the user's current Discord permissions on every request, then calls the configured Horicane integration from the server. It never trusts a guild ID supplied by the browser without that permission check.

## Extending the API

Add new resource routers under `src/server/routes/`, mount them only under `/api/v1`, and list their supported operations in the capabilities response and OpenAPI document. Keep authentication and authorization checks at each resource boundary. Add writes only alongside explicit input validation, permission checks, audit logging, and tests; do not expose an arbitrary proxy to the bot API.

For integrations, keep credentials server-side and add typed methods to the integration adapter rather than calling privileged bot APIs from client code. Version breaking contract changes under a new API prefix instead of silently changing v1 behavior.
