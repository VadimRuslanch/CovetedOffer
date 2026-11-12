import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z.coerce.number().int().positive(),
  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number().int().min(1).max(65535),
  POSTGRES_DB: z.string(),
  POSTGRES_USER: z.string().min(4),
  POSTGRES_PASSWORD: z.string().min(10),
  POSTGRES_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive(),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().int().positive(),
});

export function validateEnv(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
