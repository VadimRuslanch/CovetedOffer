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
import type { AuthenticatedRequest } from '../types.js';
import { GetUsersQueryDto } from './dto/profile-list.dto.js';
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
import { ProfileResponseDto } from './dto/profile-response.dto.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';

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
    type: ProfileResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Пользователь не найден',
    type: ErrorResponseDto,
  })
  @UseGuards(JwtAccessGuard)
  @Get('my')
  getProfile(@Req() request: AuthenticatedRequest) {
    const userId = request.user.sub;
    return this.profileService.getProfile(userId);
  }

  @ApiOperation({ summary: 'Список активных пользователей' })
  @ApiOkResponse({
    description: 'Страница профилей, отсортированная по id по возрастанию',
    type: ProfileResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'Некорректные параметры пагинации или фильтра',
    type: ErrorResponseDto,
  })
  @UseGuards(JwtAccessGuard)
  @Get('list')
  getProfiles(@Query() query: GetUsersQueryDto) {
    const offset = (query.page - 1) * query.limit;
    return this.profileService.getProfiles(query.limit, offset, query.login);
  }

  @ApiOperation({ summary: 'Обновление своего профиля' })
  @ApiOkResponse({
    description: 'Обновлённый профиль',
    type: ProfileResponseDto,
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
  ) {
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
  ) {
    await this.profileService.deleteProfile(request.user.sub);
    response.clearCookie('refreshToken', {
      path: '/auth',
    });
  }
}
