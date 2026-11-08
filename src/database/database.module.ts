import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createDatabase } from './create-database.js';
import dbConfig from '../config/database.config.js';

export const DATABASE = Symbol('DATABASE');

@Module({
  providers: [
    {
      provide: DATABASE,
      inject: [dbConfig.KEY],
      useFactory: (config: ConfigType<typeof dbConfig>) => {
        return createDatabase(config);
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
