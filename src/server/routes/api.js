import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { fetchManageableGuilds } from '../integrations/discord.js';
import { isHoricaneApiConfigured, horicaneRequest } from '../integrations/horicane.js';

export const apiRouter = Router();

const apiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Horicane Sentinel API',
    version: '1.0.0',
    description: 'Versioned, session-authenticated dashboard API. Guild operations are read-only.',
  },
  servers: [{ url: '/api/v1' }],
  security: [{ sessionCookie: [] }],
  paths: {
    '/health': { get: { summary: 'API health', responses: { '200': { description: 'API is available.' } } } },
    '/capabilities': { get: { summary: 'List API capabilities', responses: { '200': { description: 'Supported resources and operations.' } } } },
    '/me': { get: { summary: 'Get the signed-in user', responses: { '200': { description: 'Authenticated user.' }, '401': { description: 'Authentication required.' } } } },
    '/guilds': { get: { summary: 'List manageable Discord guilds', responses: { '200': { description: 'Guilds the user can manage.' } } } },
    '/guilds/{guildId}/overview': {
      get: {
        summary: 'Get a guild overview',
        parameters: [{ name: 'guildId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Guild and integration status.' }, '403': { description: 'The user cannot manage this guild.' } },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionCookie: { type: 'apiKey', in: 'cookie', name: 'horicane.sentinel.sid' },
    },
  },
};

apiRouter.get('/openapi.json', (_req, res) => {
  res.set('Cache-Control', 'no-store').json(apiDocument);
});

apiRouter.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store').json({ status: 'ok', apiVersion: '1.0.0' });
});

apiRouter.get('/capabilities', (_req, res) => {
  res.set('Cache-Control', 'no-store').json({
    apiVersion: '1.0.0',
    resources: {
      user: { path: '/me', operations: ['read'] },
      guilds: {
        path: '/guilds',
        operations: ['list', 'read-overview'],
        integrationConfigured: isHoricaneApiConfigured(),
      },
    },
    extensions: [],
  });
});

apiRouter.get('/me', requireAuth, (req, res) => {
  const { id, username, globalName, avatar } = req.user;
  res.set('Cache-Control', 'no-store');
  res.json({ user: { id, username, globalName, avatar } });
});

apiRouter.get('/guilds', requireAuth, async (req, res, next) => {
  try {
    const guilds = await fetchManageableGuilds(req.user.accessToken);
    res.set('Cache-Control', 'no-store');
    res.json({ guilds });
  } catch (error) {
    next(error);
  }
});

apiRouter.get('/guilds/:guildId/overview', requireAuth, async (req, res, next) => {
  try {
    // Validate access to the guild through the user's current Discord permissions.
    const guilds = await fetchManageableGuilds(req.user.accessToken);
    const guild = guilds.find((item) => item.id === req.params.guildId);
    if (!guild) return res.status(403).json({ error: 'guild_access_denied' });

    if (!isHoricaneApiConfigured()) {
      return res.set('Cache-Control', 'no-store').json({
        guild,
        botConnected: null,
        integrationConfigured: false,
        message: 'Horicane API integration is not configured yet.',
      });
    }

    // Sentinel has checked the signed-in user's current Discord permissions.
    // Horicane independently verifies its own access with the bot credentials.
    const overview = await horicaneRequest(`/api/v1/guilds/${encodeURIComponent(guild.id)}/overview`);
    const botConnected = overview?.bot?.connected === true;
    return res.set('Cache-Control', 'no-store').json({
      guild,
      botConnected,
      integrationConfigured: true,
      message: botConnected
        ? `Horicane is connected to ${guild.name}.`
        : `Horicane could not access ${guild.name} when the overview was requested.`,
      overview,
    });
  } catch (error) {
    return next(error);
  }
});
