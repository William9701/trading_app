import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { EmailService } from './mail/mail.service';
import { RabbitMQService } from './rabbitmq/rabbitmq.service';
import { EmailConsumer } from './mail/mail.consumer';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthMiddleware } from './auth/auth.middleware';
import * as cookieParser from 'cookie-parser';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis/redis.service';
import { RedisModule } from './redis/redis.module';
import { UserSessionModule } from './session/Usersession.module'; // ✅ Ensure this is imported


@Module({
  imports: [
    UserSessionModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT! || 3306,
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || 'root', 
      database: process.env.DB_NAME || 'cred_pal',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',  // Set to false in production
    }),
    UserModule,
    
    
  ],
  providers: [EmailService, RabbitMQService, EmailConsumer, RedisService], // ✅ Register EmailService
  exports: [EmailService], // ✅ Export EmailService
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the AuthMiddleware to the user routes
    consumer.apply(cookieParser(), AuthMiddleware).forRoutes('api/users');
  }
}
