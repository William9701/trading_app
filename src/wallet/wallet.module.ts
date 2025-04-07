import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '../entities/wallet.entity';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '../redis/redis.module';
import { UserModule } from '../user/user.module'; // Import the module containing UserService

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletBalance]),
    JwtModule.register({
      secret: '02b5ac8542cba171c14ae5d871b5f401c296fe7d95300c22993d7648db7097e6',
      signOptions: { expiresIn: '1h' },
    }),
    RedisModule,
    forwardRef(() => UserModule), // Now importing the module that exports UserService
  ],
  providers: [WalletService],  // Add UserService here if not exported by UserModule
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}
