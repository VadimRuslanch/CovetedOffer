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

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  login: string;

  @IsEmail()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(64)
  password: string;

  @IsInt()
  @Min(18)
  @Max(100)
  age: number;

  @IsString()
  @MinLength(50)
  @MaxLength(1000)
  description: string;
}
