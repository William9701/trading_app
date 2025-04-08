import { Controller, Post, Body, Get, Param, UseGuards, UnauthorizedException, Req } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiSecurity, ApiCookieAuth } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FundWalletDto } from '../dto/wallet.dto';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/user-role.enum';
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from 'src/utils/logger.util';

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
    const currentUser = req.user;
    logger.info(`Getting wallet for user ID: ${currentUser.id}`);
    
    const wallet = await this.walletService.getUserWallet(currentUser.id);
    if (!wallet) {
      logger.error(`Wallet not found for user ID: ${currentUser.id}`);
      throw new UnauthorizedException('Wallet not found');
    }

    logger.info(`Wallet retrieved successfully for user ID: ${currentUser.id}`);
    return wallet;
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
    const { currency, amount } = fundWalletDto;
    const currentUser = req.user;
    const userId = currentUser.id;
    const reference = uuidv4();

    logger.info(`Funding wallet for user ID: ${userId} with amount: ${amount} ${currency}, reference: ${reference}`);

    const fundedBalance = await this.walletService.fundWallet(userId, currency, amount, reference);

    logger.info(`Wallet funded successfully for user ID: ${userId}, new balance: ${fundedBalance}`);

    return {
      message: 'Wallet funded successfully',
      balance: fundedBalance,
    };
  }

  @Post('convert')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Convert currency in user wallet using real-time FX rate' })
  @ApiBearerAuth()
  @ApiBody({ type: ConvertCurrencyDto })
  @ApiResponse({ status: 200, description: 'Currency converted successfully' })
  @ApiResponse({ status: 400, description: 'Conversion failed or invalid input' })
  async convertCurrency(
    @Req() req: any,
    @Body() dto: ConvertCurrencyDto
  ) {
    const userId = req.user.id;
    const reference = uuidv4();

    logger.info(`Converting currency for user ID: ${userId}, from ${dto.fromCurrency} to ${dto.toCurrency}, amount: ${dto.amount}, reference: ${reference}`);

    const result = await this.walletService.convertCurrency(userId, dto, reference);

    logger.info(`Currency conversion successful for user ID: ${userId}, result: ${JSON.stringify(result)}`);

    return {
      message: 'Currency converted successfully',
      data: result
    };
  }

  @Post('trade')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Trade currencies in user wallet using cached FX rate' })
  @ApiBearerAuth()
  @ApiBody({ type: ConvertCurrencyDto })
  @ApiResponse({ status: 200, description: 'Currency traded successfully' })
  @ApiResponse({ status: 400, description: 'Trade failed or invalid input' })
  async tradeCurrency(
    @Req() req: any,
    @Body() tradeDto: ConvertCurrencyDto,
  ) {
    const userId = req.user.id;
    const currentUser = req.user;
    const reference = uuidv4();

    if (currentUser.id !== userId && currentUser.role !== UserRole.ADMIN) {
      logger.error(`Unauthorized trade attempt by user ID: ${currentUser.id} on user ID: ${userId}`);
      throw new UnauthorizedException('You are not authorized to perform this trade');
    }

    logger.info(`Initiating trade for user ID: ${userId}, from ${tradeDto.fromCurrency} to ${tradeDto.toCurrency}, amount: ${tradeDto.amount}, reference: ${reference}`);

    const result = await this.walletService.tradeCurrency(userId, tradeDto, reference);

    logger.info(`Trade completed successfully for user ID: ${userId}, result: ${JSON.stringify(result)}`);

    return {
      message: 'Currency traded successfully',
      data: result,
    };
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
    const userId = req.user.id;
    const currentUser = req.user;

    if (currentUser.id !== userId && currentUser.role !== UserRole.ADMIN) {
      logger.error(`Unauthorized access to transactions by user ID: ${currentUser.id} on user ID: ${userId}`);
      throw new UnauthorizedException('You are not authorized to view this user\'s transactions');
    }

    logger.info(`Fetching transactions for user ID: ${userId}`);
    const transactions = await this.walletService.getUserTransactions(userId);

    if (!transactions || transactions.length === 0) {
      logger.error(`No transactions found for user ID: ${userId}`);
      throw new UnauthorizedException('No transactions found for this user');
    }

    logger.info(`Transactions retrieved successfully for user ID: ${userId}`);

    return {
      message: 'Transactions retrieved successfully',
      data: transactions,
    };
  }
}
