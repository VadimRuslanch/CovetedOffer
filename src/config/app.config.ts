import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV,
}));
