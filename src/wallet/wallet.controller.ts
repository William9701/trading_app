import { Controller, Post, Body, Get, Param, UseGuards, UnauthorizedException, Req } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FundWalletDto } from '../dto/wallet.dto'; // Assuming this DTO contains userId, currency, and amount
import { UserService } from '../user/user.service'; // Assuming you have a User service to fetch user details
import { UserRole } from '../user/user-role.enum'; // Assuming you have this enum for roles
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';



@ApiTags('WalletService')
@Controller('wallet/')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly userService: UserService, // Used to get user details
  ) {}

  /**
   * Get user wallet balances by currency
   */
  @Get() 
  @UseGuards(JwtAuthGuard) // Protects the endpoint with JWT authentication
  @ApiOperation({ summary: 'Get user wallet balances by currency' })
  @ApiBearerAuth() // Indicates the need for Bearer Authentication (JWT token)
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getWallet(@Req() req: any) {
    // Ensure that the user requesting the wallet is either the owner or an admin
    const currentUser = req.user;
    // Fetch the wallet for the user and return it
    const wallet = await this.walletService.getUserWallet(currentUser.id); // Assuming getUserWallet method in walletService
    if (!wallet) {
      throw new UnauthorizedException('Wallet not found');
    }

    return wallet;
  }

  /**
   * Fund wallet in a specific currency
   */
  @Post('fund')
  @UseGuards(JwtAuthGuard) // Protects the endpoint with JWT authentication
  @ApiOperation({ summary: 'Fund wallet in NGN or other currencies' })
  @ApiBody({ type: FundWalletDto }) // Defines the request body type for funding a wallet
  @ApiBearerAuth() // Requires Bearer Authentication
  @ApiResponse({ status: 200, description: 'Wallet funded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async fundWallet(@Body() fundWalletDto: FundWalletDto, @Req() req: any) {
    const {  currency, amount } = fundWalletDto;
    const currentUser = req.user;

    const userId = currentUser.id; // Get the user ID from the request
    

    // Call the wallet service to fund the wallet
    const fundedBalance = await this.walletService.fundWallet(userId, currency, amount);

    return {
      message: 'Wallet funded successfully',
      balance: fundedBalance,
    };
  }

    /**
     * Convert currency from one type to another
     */
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
    const result = await this.walletService.convertCurrency(userId, dto);
    return {
        message: 'Currency converted successfully',
        data: result
    };
    }

    /**
   * Convert currency from one type to another
   */
  @Post('trade')
  @UseGuards(JwtAuthGuard) // Protects the endpoint with JWT authentication
  @ApiOperation({ summary: 'Trade currencies in user wallet using cached FX rate' })
  @ApiBearerAuth() // Requires Bearer Authentication
  @ApiBody({ type: ConvertCurrencyDto })
  @ApiResponse({ status: 200, description: 'Currency traded successfully' })
  @ApiResponse({ status: 400, description: 'Trade failed or invalid input' })
  async tradeCurrency(
    @Req() req: any,
    @Body() tradeDto: ConvertCurrencyDto,
  ) {
    const userId = req.user.id;

    // Check if the user is authorized to perform the trade (e.g., they are the wallet owner or an admin)
    const currentUser = req.user;

    if (currentUser.id !== userId && currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('You are not authorized to perform this trade');
    }

    // Perform the trade and return the result
    const result = await this.walletService.tradeCurrency(userId, tradeDto);
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

  /**
   * Get user transactions, ordered by date (latest first)
   */
  @Get()
  @UseGuards(JwtAuthGuard) // Protects the endpoint with JWT authentication
  @ApiOperation({ summary: 'Get user transactions, ordered by latest date' })
  @ApiBearerAuth() // Requires Bearer Authentication
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No transactions found for the user' })
  async getTransactions(@Req() req: any) {
    const userId = req.user.id;
    const currentUser = req.user;

    // Ensure that the user making the request is either the owner or an admin
    if (currentUser.id !== userId && currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('You are not authorized to view this user\'s transactions');
    }

    // Fetch the user's transactions from the service
    const transactions = await this.walletService.getUserTransactions(userId);

    if (!transactions || transactions.length === 0) {
      throw new UnauthorizedException('No transactions found for this user');
    }

    return {
      message: 'Transactions retrieved successfully',
      data: transactions,
    };
  }
}
