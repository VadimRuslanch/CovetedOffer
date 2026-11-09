import {
  Min,
  Max,
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsEmail,
  IsInt,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'new-login', minLength: 3, maxLength: 20 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  login?: string;

  @ApiPropertyOptional({
    example: 'new-email@example.com',
    minLength: 5,
    maxLength: 100,
  })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ example: 26, minimum: 18, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(100)
  age?: number;

  @ApiPropertyOptional({ example: 'Обновлённое описание', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
