import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { fetchManageableGuilds } from '../integrations/discord.js';
import { isHoricaneApiConfigured, horicaneRequest } from '../integrations/horicane.js';

export const apiRouter = Router();

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
      return res.json({
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
    return res.json({
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
