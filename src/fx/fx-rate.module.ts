// fx.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { FxRateService } from './fx-rate.service';
import { FxRateController } from './fx-rate.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import Redis from 'ioredis';
import { RedisService } from 'src/redis/redis.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    HttpModule,
    RedisModule,
    JwtModule.register({
          secret: '02b5ac8542cba171c14ae5d871b5f401c296fe7d95300c22993d7648db7097e6',
          signOptions: { expiresIn: '1h' },
        }),
    ConfigModule,
    CacheModule.register(), // 👈 Add this line
  ],
  controllers: [FxRateController],
  providers: [FxRateService],
  exports: [FxRateService],
})
export class FxModule {}
