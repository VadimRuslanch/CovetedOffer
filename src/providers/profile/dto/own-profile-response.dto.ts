import { ApiProperty } from '@nestjs/swagger';
import type { OwnProfile } from '../../../users/domain/user.js';

export class OwnProfileResponseDto implements OwnProfile {
  @ApiProperty({ example: 'demetra', minLength: 3, maxLength: 20 })
  login: string;

  @ApiProperty({ example: 'demetra@example.com', minLength: 5, maxLength: 100 })
  email: string;

  @ApiProperty({ example: 25, minimum: 20, maximum: 100 })
  age: number;

  @ApiProperty({
    example: 'Backend-разработчик',
    maxLength: 1000,
    description: 'Описание пользователя, может быть пустой строкой',
  })
  description: string;
}
