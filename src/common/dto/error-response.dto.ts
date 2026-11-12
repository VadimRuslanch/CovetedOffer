import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Неверный логин или пароль' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['login must be longer than or equal to 3 characters'],
      },
    ],
  })
  message: string | string[];

  @ApiProperty({ example: '/auth/login' })
  path: string;

  @ApiProperty({ example: '2026-11-09T12:00:00.000Z', format: 'date-time' })
  timestamp: string;
}
