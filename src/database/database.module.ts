import { Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createDatabase } from './create-database.js';
import dbConfig from '../config/database.config.js';
import { Kysely } from 'kysely';
import { Database } from './database.types.js';

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
export class DatabaseModule implements OnApplicationShutdown {
  constructor(
    @Inject(DATABASE)
    private readonly db: Kysely<Database>,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await this.db.destroy();
  }
}
