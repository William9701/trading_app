import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../redis/redis.service';  // Assuming RedisService is in src/redis
import { logger } from '../utils/logger.util'; // Import logger
import { UserSession } from 'src/entities/session.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSessionRepository } from '../session/userSession.repository';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService,
    private readonly userSessionRepository: UserSessionRepository,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    

    const sessionId = req.cookies.session_id; // Read cookie automatically
    if (!sessionId) {
      throw new UnauthorizedException('login to access this route');
    }

    // Retrieve token from Redis
    const sessionData = await this.userSessionRepository.findOne({ where: { sessionId } });
    if (!sessionData) {
      throw new UnauthorizedException('Invalid session, pls login to access this route');
    }

    const  token  = sessionData.access_token;
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    // Attach token automatically to the request header
    req.headers['authorization'] = `Bearer ${token}`;
    logger.info('Token attached to request header');
    next();
  }
}
