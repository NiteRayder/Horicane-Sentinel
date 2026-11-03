import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, isProduction } from './config.js';
import { passport } from './auth/discord.js';
import { authRouter } from './routes/auth.js';
import { apiRouter } from './routes/api.js';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, '../../dist');

if (isProduction) app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'script-src': ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'https://cdn.discordapp.com'],
      'connect-src': ["'self'"],
    },
  },
}));
app.use(express.json({ limit: '32kb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
}));

app.use(session({
  name: 'horicane.sentinel.sid',
  secret: config.SESSION_SECRET || 'local-development-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRouter);
// The versioned API is the supported surface. Keep /api temporarily for existing clients.
app.use('/api/v1', apiRouter);
app.use('/api', apiRouter);

app.post('/logout', (req, res, next) => {
  req.logout((logoutError) => {
    if (logoutError) return next(logoutError);
    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);
      res.clearCookie('horicane.sentinel.sid', { httpOnly: true, sameSite: 'lax', secure: isProduction });
      return res.status(204).end();
    });
  });
});

if (isProduction) {
  app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) return next();
    return res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  // Do not leak tokens, provider payloads, or stack traces to clients.
  const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 502;
  if (config.NODE_ENV !== 'test') {
    console.error(JSON.stringify({ level: 'error', message: error.message, status }));
  }
  res.status(status).json({ error: 'request_failed', message: 'The request could not be completed.' });
});

app.listen(config.PORT, () => {
  console.log(`Horicane Sentinel server listening on port ${config.PORT}`);
});

export { app };
