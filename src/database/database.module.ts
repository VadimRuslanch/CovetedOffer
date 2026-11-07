import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDatabase } from './create-database.js';

export const DATABASE = Symbol('DATABASE');

@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        return createDatabase({
          host: configService.getOrThrow<string>('POSTGRES_HOST'),
          port: Number(configService.getOrThrow<string>('POSTGRES_PORT')),
          database: configService.getOrThrow<string>('POSTGRES_DB'),
          user: configService.getOrThrow<string>('POSTGRES_USER'),
          password: configService.getOrThrow<string>('POSTGRES_PASSWORD'),
          max: 10,
          statement_timeout: Number(
            configService.getOrThrow<string>('POSTGRES_STATEMENT_TIMEOUT_MS'),
          ),
        });
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
