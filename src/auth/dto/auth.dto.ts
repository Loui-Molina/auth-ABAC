import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'admin@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Alicia Admin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: Role,
    example: 'ADMIN',
    description: 'Determines access level',
  })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    example: 90000,
    description: 'Financial info (Manager/Admin)',
  })
  @IsNumber()
  @IsOptional()
  salary?: number;

  @ApiProperty({
    example: '+1-555-0199',
    description: 'Personal info',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    example: 'ID-123456',
    description: 'Personal Info',
  })
  @IsString()
  @IsOptional()
  nationalId?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
