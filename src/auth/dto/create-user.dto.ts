import {
  Min,
  Max,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'demetra', minLength: 3, maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  login: string;

  @ApiProperty({ example: 'demetra@example.com', minLength: 5, maxLength: 100 })
  @IsEmail()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  email: string;

  @ApiProperty({ example: 'strong-password', minLength: 8, maxLength: 64 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  password: string;

  @ApiProperty({ example: 25, minimum: 18, maximum: 100 })
  @IsInt()
  @Min(18)
  @Max(100)
  age: number;

  @ApiProperty({
    example: 'Backend-разработчик',
    maxLength: 1000,
    description: 'Описание пользователя, может быть пустой строкой',
  })
  @IsString()
  @MaxLength(1000)
  description: string;
}
