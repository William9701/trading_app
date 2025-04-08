import { Module, RequestMethod } from '@nestjs/common';
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
import { User } from './entities/user.entity';
import { RedisModule } from './redis/redis.module';
import { UserSessionModule } from './session/Usersession.module'; // ✅ Ensure this is imported
import { WalletModule } from './wallet/wallet.module';
import { FxModule } from './fx/fx-rate.module';
@Module({
  imports: [
    WalletModule,
    FxModule,
    UserSessionModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT! ,
      username: process.env.DB_USER,
      password: process.env.DB_PASS, 
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',  // Set to false in production
    }),
    TypeOrmModule.forFeature([User]), 
    UserModule,
    
    
  ],
  providers: [EmailService, RabbitMQService, EmailConsumer, RedisService], // ✅ Register EmailService
  exports: [EmailService], // ✅ Export EmailService
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the AuthMiddleware to the user routes
    consumer.apply(cookieParser(), AuthMiddleware).forRoutes(
      { path: 'api/users', method: RequestMethod.ALL },
      { path: 'fx/rates', method: RequestMethod.ALL },
      { path: 'wallet', method: RequestMethod.ALL },
      { path: 'transactions', method: RequestMethod.ALL },
      { path: 'wallet/(.*)', method: RequestMethod.ALL }
    );
  }
}
