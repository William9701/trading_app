import { IsEmail, IsOptional, IsString, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Valid email address' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({ example: 'P@ssw0rd123', description: 'Password (min 6 characters)' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'Valid email address' })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;
  
    @ApiProperty({ example: 'P@ssw0rd123', description: 'Password (min 6 characters)' })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password: string;
  }

export class VerifyDto {
    @ApiProperty({ example: 'user@example.com', description: 'Valid email address' })
    @IsEmail({}, { message: 'Invalid email format' })
    email: string;
  
    @ApiProperty({ example: '123456', description: 'OTP' })
    @IsString()
    @MinLength(6, { message: 'OTP must be at least 6 characters long' })
    otp: string;
  }


export class UpdateUserDto {
    @IsOptional()
    first_name?: string;
  
    @IsOptional()
    last_name?: string;
  
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
}

export class UserResponseDto {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    is_verified: boolean;
    is_active: boolean;
  }
