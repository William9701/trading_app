import { IsEmail, IsOptional, IsString, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user/user-role.enum';

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

    @ApiProperty({ example: 'user', description: 'set user role' })
    @IsString()
    role: UserRole;
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
    @ApiProperty({ example: 'John', description: 'First name of the user', required: false })
    @IsOptional()
    @IsString()
    first_name?: string;
  
    @ApiProperty({ example: 'Doe', description: 'Last name of the user', required: false })
    @IsOptional()
    @IsString()
    last_name?: string;
  
    @ApiProperty({ example: true, description: 'Set whether the user is active', required: false })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean;
  }
  

  export class UserResponseDto {
    @ApiProperty({ example: 'b1d7a14e-4c84-4c44-9a2e-13ad43e62a1e', description: 'Unique identifier of the user' })
    id: string;
  
    @ApiProperty({ example: 'user@example.com', description: 'Email address of the user' })
    email: string;
  
    @ApiProperty({ example: 'John', description: 'First name of the user', required: false })
    first_name?: string;
  
    @ApiProperty({ example: 'Doe', description: 'Last name of the user', required: false })
    last_name?: string;
  
    @ApiProperty({ example: true, description: 'Whether the user has verified their email' })
    is_verified: boolean;
  
    @ApiProperty({ example: true, description: 'Whether the user account is active' })
    is_active: boolean;
  }
  