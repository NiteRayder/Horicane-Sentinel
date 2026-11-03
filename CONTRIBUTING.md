# Contributing to Horicane Sentinel

## Development

- Use Node.js 22.12+.
- Keep OAuth credentials, session secrets, bot tokens, and API tokens out of Git.
- Keep privileged API calls on the server.
- Every guild-management endpoint must verify the signed-in user's current permissions and Horicane's presence/access to the guild.
- Keep UI states honest: do not show a feature as working until its backend is implemented and tested.

## Before opening a pull request

```bash
npm run lint
npm test
npm run build
```

Describe security-sensitive changes and include test coverage for authorization decisions.
