import { ApiProperty } from '@nestjs/swagger';
import { PublicProfile } from '../../../users/domain/user.js';

export class PublicProfileResponseDto implements PublicProfile {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'demetra', minLength: 3, maxLength: 20 })
  login: string;

  @ApiProperty({ example: 25, minimum: 20, maximum: 100 })
  age: number;

  @ApiProperty({
    example: 'Backend-разработчик',
    maxLength: 1000,
    description: 'Описание пользователя, может быть пустой строкой',
  })
  description: string;
}
