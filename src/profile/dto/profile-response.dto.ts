import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'demetra' })
  login: string;

  @ApiProperty({ example: 'demetra@example.com' })
  email: string;

  @ApiProperty({ example: 25 })
  age: number;

  @ApiProperty({ example: 'Backend-разработчик' })
  description: string;
}
