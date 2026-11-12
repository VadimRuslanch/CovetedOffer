import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../../users/users.module.js';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessGuard } from './guards/jwt-access.guard.js';
import { DatabaseModule } from '../../database/database.module.js';
import { HashService } from './hash.service.js';
import { TokenService } from './token.service.js';

@Module({
  imports: [UsersModule, DatabaseModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessGuard, HashService, TokenService],
  exports: [JwtAccessGuard, TokenService],
})
export class AuthModule {}
