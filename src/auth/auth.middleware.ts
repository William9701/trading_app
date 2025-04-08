import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util'; // Import logger
import { UserSession } from '../entities/session.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSessionRepository } from '../session/userSession.repository';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly userSessionRepository: UserSessionRepository,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    

    const sessionId = req.cookies.session_id; // Read cookie automatically
    if (!sessionId) {
      throw new UnauthorizedException('login to access this route');
    }

    
    const sessionData = await this.userSessionRepository.findOne({ where: { sessionId } });
    if (!sessionData) {
      throw new UnauthorizedException('Invalid session, pls login to access this route');
    }

    const  token  = sessionData.access_token;
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    // Check if the User is verified
    const user = await this.userRepository.findOne({ where: { id: sessionData.userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.isVerified) {
      throw new UnauthorizedException('User not verified');
    }

    req.user = user;  // Attach user object to request (including role, id, etc.)
    // Attach token automatically to the request header
    req.headers['authorization'] = `Bearer ${token}`;
    logger.info('Token attached to request header');
    next();
  }
}
