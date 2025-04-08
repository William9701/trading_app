import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../mail/mail.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { MonitoringService } from '../monitoring/monitoring.service';
import { WalletService } from '../wallet/wallet.service';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { UserSessionRepository } from '../session/userSession.repository';
import * as bcrypt from 'bcryptjs';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { UserRole } from './user-role.enum';

jest.mock('bcryptjs');

const mockUserRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockUserSessionRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let userRepo;
  let sessionRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: UserSessionRepository, useFactory: mockUserSessionRepository },
        { provide: JwtService, useValue: { sign: jest.fn(() => 'mockToken') } },
        { provide: EmailService, useValue: { send: jest.fn() } },
        { provide: RabbitMQService, useValue: { sendToQueue: jest.fn() } },
        { provide: MonitoringService, useValue: { increaseRegistrationCount: jest.fn(), increaseLoginCount: jest.fn() } },
        { provide: WalletService, useValue: { createWalletForUser: jest.fn() } },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepo = module.get(getRepositoryToken(User));
    sessionRepo = module.get<UserSessionRepository>(UserSessionRepository);
  });

  describe('register', () => {
    it('should throw ConflictException if email is taken', async () => {
      userRepo.findOne.mockResolvedValue({ email: 'test@example.com' });
      await expect(
        service.register('test@example.com', 'Test@1234', UserRole.USER),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const res = { cookie: jest.fn(), json: jest.fn() } as unknown as Response;
      await expect(service.login('no@email.com', 'pass', res)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userRepo.findOne.mockResolvedValue({ email: 'test@example.com', password: 'hash', isVerified: true });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const res = { cookie: jest.fn(), json: jest.fn() } as unknown as Response;
      await expect(service.login('test@example.com', 'wrongpass', res)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getUser', () => {
    it('should throw NotFoundException if user is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getUser('1')).rejects.toThrow(NotFoundException);
    });

    it('should return user if found', async () => {
      const user = { id: '1', email: 'test@example.com' };
      userRepo.findOne.mockResolvedValue(user);
      const result = await service.getUser('1');
      expect(result).toEqual(user);
    });
  });

  describe('logout', () => {
    it('should clear session and cookie', async () => {
      sessionRepo.delete.mockResolvedValue({});
      const res = { clearCookie: jest.fn(), json: jest.fn() } as unknown as Response;
      await service.logout('sessionId', res);
      expect(res.clearCookie).toHaveBeenCalledWith('session_id', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });
});