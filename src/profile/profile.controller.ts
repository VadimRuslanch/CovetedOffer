import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service.js';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import type { AuthenticatedRequest } from '../types.js';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(JwtAccessGuard)
  @Get('my')
  getProfile(@Req() request: AuthenticatedRequest) {
    const userId = request.user.sub;
    return this.profileService.getProfile(userId);
  }
}
