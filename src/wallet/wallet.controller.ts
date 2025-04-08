import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    UnauthorizedException,
    Req,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
    ApiSecurity,
    ApiCookieAuth,
  } from '@nestjs/swagger';
  import { WalletService } from './wallet.service';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { FundWalletDto } from '../dto/wallet.dto';
  import { UserService } from '../user/user.service';
  import { UserRole } from '../user/user-role.enum';
  import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
  import { v4 as uuidv4 } from 'uuid';
  import { logger } from '../utils/logger.util';
  
  @ApiTags('WalletService')
  @Controller('wallet/')
  export class WalletController {
    constructor(
      private readonly walletService: WalletService,
      private readonly userService: UserService,
    ) {}
  
    @Get()
    @ApiSecurity('cookieAuth')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get user wallet balances by currency' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Wallet not found' })
    async getWallet(@Req() req: any) {
      try {
        const currentUser = req.user;
        logger.info(`Getting wallet for user ID: ${currentUser.id}`);
  
        const wallet = await this.walletService.getUserWallet(currentUser.id);
  
        if (!wallet) {
          throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
        }
  
        return {
          message: 'Wallet retrieved successfully',
          data: wallet,
        };
      } catch (error) {
        logger.error(`Error getting wallet: ${error.message}`);
        throw new HttpException(error.message || 'Internal server error', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    @Post('fund')
    @ApiCookieAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Fund wallet in NGN or other currencies' })
    @ApiBody({ type: FundWalletDto })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Wallet funded successfully' })
    @ApiResponse({ status: 400, description: 'Invalid request data' })
    async fundWallet(@Body() fundWalletDto: FundWalletDto, @Req() req: any) {
      try {
        const { currency, amount } = fundWalletDto;
        const userId = req.user.id;
        const reference = uuidv4();
  
        const fundedBalance = await this.walletService.fundWallet(userId, currency, amount, reference);
  
        return {
          message: 'Wallet funded successfully',
          balance: fundedBalance,
        };
      } catch (error) {
        logger.error(`Error funding wallet: ${error.message}`);
        throw new HttpException(error.message || 'Wallet funding failed', error.status || HttpStatus.BAD_REQUEST);
      }
    }
  
    @Post('convert')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Convert currency in user wallet using real-time FX rate' })
    @ApiBearerAuth()
    @ApiBody({ type: ConvertCurrencyDto })
    @ApiResponse({ status: 200, description: 'Currency converted successfully' })
    @ApiResponse({ status: 400, description: 'Conversion failed or invalid input' })
    async convertCurrency(@Req() req: any, @Body() dto: ConvertCurrencyDto) {
      try {
        const userId = req.user.id;
        const reference = uuidv4();
  
        const result = await this.walletService.convertCurrency(userId, dto, reference);
  
        return {
          message: 'Currency converted successfully',
          data: result,
        };
      } catch (error) {
        logger.error(`Currency conversion error: ${error.message}`);
        throw new HttpException(error.message || 'Conversion failed', error.status || HttpStatus.BAD_REQUEST);
      }
    }
  
    @Post('trade')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Trade currencies in user wallet using cached FX rate' })
    @ApiBearerAuth()
    @ApiBody({ type: ConvertCurrencyDto })
    @ApiResponse({ status: 200, description: 'Currency traded successfully' })
    @ApiResponse({ status: 400, description: 'Trade failed or invalid input' })
    async tradeCurrency(@Req() req: any, @Body() tradeDto: ConvertCurrencyDto) {
      const currentUser = req.user;
      const reference = uuidv4();
  
    //   if (currentUser.role !== UserRole.ADMIN) {
    //     logger.error(`Unauthorized trade attempt by user ID: ${currentUser.id}`);
    //     throw new UnauthorizedException('You are not authorized to perform this trade');
    //   }
  
      try {
        const result = await this.walletService.tradeCurrency(currentUser.id, tradeDto, reference);
        return {
          message: 'Currency traded successfully',
          data: result,
        };
      } catch (error) {
        logger.error(`Trade failed: ${error.message}`);
        throw new HttpException(error.message || 'Trade failed', error.status || HttpStatus.BAD_REQUEST);
      }
    }
  }
  
  @ApiTags('transactions')
  @Controller('transactions/')
  export class TransactionController {
    constructor(private readonly walletService: WalletService) {}
  
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get user transactions, ordered by latest date' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
    @ApiResponse({ status: 404, description: 'No transactions found for the user' })
    async getTransactions(@Req() req: any) {
      const currentUser = req.user;
  
      try {
        const transactions = await this.walletService.getUserTransactions(currentUser.id);
  
        if (!transactions || transactions.length === 0) {
          throw new HttpException('No transactions found', HttpStatus.NOT_FOUND);
        }
  
        return {
          message: 'Transactions retrieved successfully',
          data: transactions,
        };
      } catch (error) {
        logger.error(`Error fetching transactions: ${error.message}`);
        throw new HttpException(error.message || 'Could not fetch transactions', error.status || HttpStatus.BAD_REQUEST);
      }
    }
  }
  