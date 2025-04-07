import { Controller, Post, Body, Get, Req, Res, Param, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegisterDto, VerifyDto } from '../dto/user.dto';
import { LoginDto } from '../dto/user.dto';

@ApiTags('Users') 
@Controller('api/users')
export class UserProfileController {
  constructor(private readonly userService: UserService) {}
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    return this.userService.getUser(id);
  }

  
}

@ApiTags('Authentication') 
@Controller("auth/")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiBody({
    type: RegisterDto,  // Ensuring Swagger uses DTO schema
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.userService.register(registerDto.email, registerDto.password);
  }


  @Post('verify')
  @ApiOperation({ summary: 'Verify a new user' })
  @ApiResponse({ status: 201, description: 'User verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiBody({
    type: VerifyDto,  // Ensuring Swagger uses DTO schema
  })
  async verify(@Body() verifyDto: VerifyDto) {
    return this.userService.verifyOtp(verifyDto.email, verifyDto.otp);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  @ApiResponse({ status: 400, description: 'Invalid credentials' })
  @ApiBody({
    type: LoginDto, // Ensuring Swagger uses DTO schema
  })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    return this.userService.login(loginDto.email, loginDto.password, res);
  }

  @Get('logout')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Req() req, @Res() res: Response) {
    const sessionId = req.cookies.session_id;
    return this.userService.logout(sessionId, res);
  }

}
