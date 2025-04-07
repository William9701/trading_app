import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from './user.repository'; // Adjust the import path as necessary
import { User } from '../entities/user.entity'; // Adjust the import path as necessary
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../mail/mail.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import * as EmailValidator from 'email-validator';
import { logger } from '../utils/logger.util'; // Import logger
import { MonitoringService } from '../monitoring/monitoring.service';
import { plainToInstance } from 'class-transformer';
import { UserSession } from '../entities/session.entity'; // Import UserSession entity
import { v4 as uuidv4 } from 'uuid';
import { randomInt } from 'crypto'; // Import randomInt for OTP generation

import { UserSessionRepository } from '../session/userSession.repository'; // Adjust the import path as necessary

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly userSessionRepository: UserSessionRepository, // NO @InjectRepository here
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
        private readonly rabbitMQService: RabbitMQService,
        private readonly monitoringService: MonitoringService,
      ) {}
      

  async register(
    email: string,
    password: string,
  ): Promise<{ message: string }> {
    logger.info(`Register request received for ${email}`);
    this.validateInput(email, password);

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      logger.warn(`Email already in use: ${email}`);
      throw new ConflictException('Email already in use');
    }

    // Step 2: Generate OTP and store it
    const otp = this.generateOtp();
    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 10); // OTP expires in 10 minutes

    const user = this.userRepository.create({
      email,
      password: await this.hashPassword(password),
      verifyToken: otp, // Store OTP in VerifyToken field
    });

    await this.userRepository.save(user);

    // Step 3: Send OTP to user via RabbitMQ
    try {
      await this.rabbitMQService.sendToQueue(
        JSON.stringify({
          type: 'verification',
          email,
          recipientName: email.split('@')[0], // Simple extraction of name from email
          otpCode: otp,
        }),
      );
      logger.info(`OTP sent to email: ${email}`);
    } catch (error) {
      logger.error(`Failed to send OTP to ${email}`, error.message);
      throw new InternalServerErrorException('Failed to send OTP email');
    }

    this.monitoringService.increaseRegistrationCount(); // Increment registration metric
    logger.info(`User successfully registered: ${email}`);

    return {
      message:
        'User registered successfully. Please check your email for the OTP.',
    };
  }
  private validateInput(email: string, password: string): void {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    if (!EmailValidator.validate(email)) {
      throw new BadRequestException('Invalid email format');
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Password too weak. Must contain at least 8 characters, a number, and a special character.',
      );
    }
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private generateOtp(): string {
    return randomInt(100000, 999999).toString(); // Generate a 6-digit OTP
  }

  private async sendWelcomeEmail(email: string): Promise<void> {
    try {
      await this.rabbitMQService.sendToQueue(JSON.stringify({ email }));
    } catch (error) {
      logger.error(`Failed to send welcome email to ${email}`, error.message);
    }
  }

  async login(email: string, password: string, res: Response) {
    logger.info(`Login attempt for ${email}`);
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      logger.warn(`User not found: ${email}`);
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn(`Invalid password for ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ id: user.id, email: user.email });
    const sessionId = uuidv4();

    // Store session in the UserSession table
    try {
      const userSession = this.userSessionRepository.create({
        userId: user.id,
        sessionId,
        access_token: token,
      });
      await this.userSessionRepository.save(userSession);
      this.monitoringService.increaseLoginCount(); // Increment login metric
      logger.info(`Session stored in UserSession table for ${email}`);
    } catch (error) {
      logger.error(
        `Error storing session in UserSession table for ${email}: ${error.message}`,
      );
      throw new InternalServerErrorException('Error storing session');
    }

    try {
      res.cookie('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000,
      });
    } catch (error) {
      logger.error(`Cookie error for ${email}: ${error.message}`);
      throw new InternalServerErrorException(
        'Error setting authentication cookie',
      );
    }

    return res.json({ token });
  }

  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return plainToInstance(User, user); // Apply transformation to exclude password
  }

  async logout(sessionId: string, res: Response) {
    await this.userSessionRepository.delete({ sessionId });
    res.clearCookie('session_id');
    return res.json({ message: 'Logged out successfully' });
  }

  async verifyOtp(email: string, otp: string) {
    logger.info(`OTP verification request for ${email}`);
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.verifyToken !== otp) {
        throw new BadRequestException('Invalid OTP');
    }
    user.isVerified = true;
    await this.userRepository.save(user);
    logger.info(`OTP verified for ${email}`);
    // this.monitoringService.increaseOtpVerificationCount(); // Increment OTP verification metric
    this.sendWelcomeEmail(email); // Send welcome email after successful OTP verification
    logger.info(`Welcome email sent to ${email}`);
    // return res.json({ message: 'User verified successfully' });
  }
}
