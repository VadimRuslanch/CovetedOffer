import {
  Controller,
  Get,
  Req,
  UseGuards,
  Query,
  Patch,
  Body,
  Delete,
  Res,
} from '@nestjs/common';
import { ProfileService } from './profile.service.js';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard.js';
import type { AuthenticatedRequest } from '../../types.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto.js';
import { clearRefreshCookie } from '../auth/refresh-cookie.helper.js';
import { OwnProfileResponseDto } from './dto/own-profile-response.dto.js';
import { GetProfilesQueryDto } from './dto/get-profiles-query.dto.js';
import { PublicProfileResponseDto } from './dto/public-profile-response.dto.js';

@ApiTags('Profile')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  description: 'Access-токен отсутствует, недействителен или истёк',
  type: ErrorResponseDto,
})
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({ summary: 'Получение своего профиля' })
  @ApiOkResponse({
    description: 'Профиль текущего пользователя',
    type: OwnProfileResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Пользователь не найден',
    type: ErrorResponseDto,
  })
  @UseGuards(JwtAccessGuard)
  @Get('my')
  getProfile(
    @Req() request: AuthenticatedRequest,
  ): Promise<OwnProfileResponseDto> {
    const userId = request.user.sub;
    return this.profileService.getProfile(userId);
  }

  @ApiOperation({ summary: 'Список активных пользователей' })
  @ApiOkResponse({
    description: 'Страница профилей, отсортированная по id по возрастанию',
    type: PublicProfileResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'Некорректные параметры пагинации или фильтра',
    type: ErrorResponseDto,
  })
  @UseGuards(JwtAccessGuard)
  @Get('list')
  getProfiles(
    @Query() query: GetProfilesQueryDto,
  ): Promise<PublicProfileResponseDto[]> {
    const { page, limit, login } = query;
    return this.profileService.getProfiles(page, limit, login);
  }

  @ApiOperation({ summary: 'Обновление своего профиля' })
  @ApiOkResponse({
    description: 'Обновлённый профиль',
    type: OwnProfileResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Ошибка валидации',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Логин или email уже используется',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Пользователь не найден',
    type: ErrorResponseDto,
  })
  @UseGuards(JwtAccessGuard)
  @Patch('update')
  updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body()
    dto: UpdateProfileDto,
  ): Promise<OwnProfileResponseDto> {
    return this.profileService.updateProfile(request.user.sub, dto);
  }

  @ApiOperation({ summary: 'Мягкое удаление своего профиля' })
  @ApiOkResponse({
    description: 'Профиль удалён, refresh-токен отозван, cookie очищена',
  })
  @ApiNotFoundResponse({
    description: 'Пользователь не найден',
    type: ErrorResponseDto,
  })
  @UseGuards(JwtAccessGuard)
  @Delete('delete')
  async deleteProfile(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.profileService.deleteProfile(request.user.sub);
    clearRefreshCookie(response);
  }
}
