import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './providers/auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { validateEnv } from './config/env.schema.js';
import jwtConfig from './config/jwt.config.js';
import dbConfig from './config/database.config.js';
import appConfig from './config/app.config.js';
import { ProfileModule } from './providers/profile/profile.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [appConfig, jwtConfig, dbConfig],
    }),
    DatabaseModule,
    AuthModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [DatabaseModule],
})
export class AppModule {}
