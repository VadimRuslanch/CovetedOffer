import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { ProfileService } from './profile.service.js';
import { ProfileController } from './profile.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
