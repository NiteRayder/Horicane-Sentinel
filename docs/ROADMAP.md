# Roadmap

## Foundation
- [x] Responsive black, white, and silver UI
- [x] Discord OAuth2 server-side flow
- [x] Eligible Discord server listing
- [x] Basic security headers, rate limiting, and environment validation
- [x] Server-only Horicane API adapter boundary
- [x] CI workflow, linting, and smoke tests

## Integration work
- [x] Confirm and document the actual Horicane management API contract
- [x] Verify current user permissions and Horicane bot membership for each requested guild
- [x] Add server overview from the real Horicane API
- [ ] Add a persistent production session store
- [ ] Add moderation cases and action history
- [ ] Add audit-log browsing
- [ ] Add channel and role management with permission checks
- [ ] Add configuration and automation panels
- [ ] Add tests for every authorization-sensitive endpoint
- [ ] Add deployment documentation and operational monitoring

The Horicane API v1 currently provides health and read-only server overview data. Other management features remain incomplete until backed by explicit API operations and authorization checks.
