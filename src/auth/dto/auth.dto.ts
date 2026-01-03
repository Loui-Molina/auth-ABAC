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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'admin@company.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Alicia Admin' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    enum: Role,
    example: 'ADMIN',
    description: 'Determines access level',
  })
  @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({
    example: 90000,
    description: 'Sensitive financial data (Manager/Admin only)',
  })
  @IsNumber()
  @IsOptional()
  salary?: number;

  @ApiPropertyOptional({
    example: '+1-555-0199',
    description: 'PII: Personal Phone Number',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'ID-123456',
    description: 'SPII: National Gov ID (Strictly Restricted)',
  })
  @IsString()
  @IsOptional()
  nationalId?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@company.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
