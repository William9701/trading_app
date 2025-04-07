import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService, // Inject Redis Service
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let authHeader = request.headers.authorization;
    let token: string 

    if (authHeader) {
      token = authHeader.split(' ')[1];
    } else  {
      // If no token in headers
      throw new UnauthorizedException('You have to be logged in to access this ')
    }

    

    try {
      const decoded = this.jwtService.verify(token);
      request.user = decoded; // Attach user info to request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
