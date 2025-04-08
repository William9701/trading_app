import { Test, TestingModule } from '@nestjs/testing';
import { UserController, UserProfileController } from './user.controller';
import { UserService } from './user.service';
import { RegisterDto, VerifyDto, LoginDto } from '../dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { Response } from 'express';
import { UserRole } from './user-role.enum';

const mockUserService = {
  register: jest.fn(),
  verifyOtp: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  getUser: jest.fn(),
};

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  it('should register a user', async () => {
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'Test123!',
      role: UserRole.USER,
    };
    
    const result = { message: 'Registered' };

    mockUserService.register.mockResolvedValue(result);

    expect(await userController.register(dto)).toEqual(result);
    expect(mockUserService.register).toHaveBeenCalledWith(dto.email, dto.password, dto.role);
  });

  it('should verify a user', async () => {
    const dto: VerifyDto = {
      email: 'test@example.com',
      otp: '123456',
    };
    const res = {
      cookie: jest.fn(),
      json: jest.fn(),
    } as any as Response;
    const result = { message: 'Verified' };

    mockUserService.verifyOtp.mockResolvedValue(result);

    expect(await userController.verify(dto, res)).toEqual(result);
    expect(mockUserService.verifyOtp).toHaveBeenCalledWith(dto.email, dto.otp);
  });

  it('should login a user', async () => {
    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'Test123!',
    };
    const res = {
      cookie: jest.fn(),
      json: jest.fn(),
    } as any as Response;

    const result = { message: 'Logged in' };

    mockUserService.login.mockResolvedValue(result);

    expect(await userController.login(dto, res)).toEqual(result);
    expect(mockUserService.login).toHaveBeenCalledWith(dto.email, dto.password, res);
  });

  it('should logout a user', async () => {
    const req = {
      cookies: { session_id: 'abc123' },
    };
    const res = {
      clearCookie: jest.fn(),
      json: jest.fn(),
    } as any as Response;

    const result = { message: 'Logged out' };

    mockUserService.logout.mockResolvedValue(result);

    expect(await userController.logout(req, res)).toEqual(result);
    expect(mockUserService.logout).toHaveBeenCalledWith(req.cookies.session_id, res);
  });
});

describe('UserProfileController', () => {
  let controller: UserProfileController;
  let service: UserService;

  beforeEach(async () => {
    const mockUserService = {
      getUser: jest.fn().mockResolvedValue({ id: '1', email: 'test@example.com' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserProfileController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      .overrideGuard(JwtAuthGuard) // 👈 override JwtAuthGuard with a mock
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    controller = module.get<UserProfileController>(UserProfileController);
    service = module.get<UserService>(UserService);
  });

  it('should get user by ID', async () => {
    const result = await controller.getUser('1');
    expect(result).toEqual({ id: '1', email: 'test@example.com' });
    expect(service.getUser).toHaveBeenCalledWith('1');
  });
});
