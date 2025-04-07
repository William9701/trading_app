// src/session/usersession.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSession } from '../entities/session.entity';
import { UserSessionRepository } from './userSession.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserSession])],
  providers: [UserSessionRepository],
  exports: [UserSessionRepository],
})
export class UserSessionModule {}
