import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: '02b5ac8542cba171c14ae5d871b5f401c296fe7d95300c22993d7648db7097e6',
    });
  }

  async validate(payload: any) {
    return { userId: payload.id, email: payload.email };
  }
}
