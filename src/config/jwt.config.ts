import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  accessTtl: Number(process.env.JWT_ACCESS_TTL_SECONDS),
  refreshTtl: Number(process.env.JWT_REFRESH_TTL_SECONDS),
}));
