import { Controller, Post, Body, Get, Param, UseGuards, UnauthorizedException, Req } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FundWalletDto } from '../dto/wallet.dto'; // Assuming this DTO contains userId, currency, and amount
import { UserService } from '../user/user.service'; // Assuming you have a User service to fetch user details
import { UserRole } from '../user/user-role.enum'; // Assuming you have this enum for roles

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
  @Get(':userId') // :userId will be passed to identify the user
  @UseGuards(JwtAuthGuard) // Protects the endpoint with JWT authentication
  @ApiOperation({ summary: 'Get user wallet balances by currency' })
  @ApiBearerAuth() // Indicates the need for Bearer Authentication (JWT token)
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getWallet(@Param('userId') userId: string, @Req() req: any) {
    // Ensure that the user requesting the wallet is either the owner or an admin
    const currentUser = req.user;

    // Check if the user ID matches the one in the request or if the user is an admin
    if (currentUser.id !== userId && currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('You are not authorized to access this wallet');
    }

    // Fetch the wallet for the user and return it
    const wallet = await this.walletService.getUserWallet(userId); // Assuming getUserWallet method in walletService
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
    const { userId, currency, amount } = fundWalletDto;
    const currentUser = req.user;

    // Check if the user is funding their own wallet or if they are an admin
    if (currentUser.id !== userId && currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('You are not authorized to fund this wallet');
    }

    // Call the wallet service to fund the wallet
    const fundedBalance = await this.walletService.fundWallet(userId, currency, amount);

    return {
      message: 'Wallet funded successfully',
      balance: fundedBalance,
    };
  }
}
