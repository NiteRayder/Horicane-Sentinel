import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  DISCORD_CLIENT_ID: z.string().optional().default(''),
  DISCORD_CLIENT_SECRET: z.string().optional().default(''),
  DISCORD_REDIRECT_URI: z.string().url().default('http://localhost:3000/auth/discord/callback'),
  SESSION_SECRET: z.string().optional().default(''),
  HORICANE_API_BASE_URL: z.string().url().optional().or(z.literal('')).default(''),
  HORICANE_API_TOKEN: z.string().optional().default('').refine((value) => value.length === 0 || value.length >= 32, { message: 'must be at least 32 characters' }),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`);
}

export const config = parsed.data;
export const isProduction = config.NODE_ENV === 'production';
export const discordOAuthConfigured = Boolean(
  config.DISCORD_CLIENT_ID && config.DISCORD_CLIENT_SECRET && config.DISCORD_REDIRECT_URI,
);

if (isProduction && config.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters in production.');
}
