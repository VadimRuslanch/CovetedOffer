import { registerAs } from '@nestjs/config';

export default registerAs('db', () => ({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  statement_timeout: Number(process.env.POSTGRES_STATEMENT_TIMEOUT_MS),
  max: 10,
}));
