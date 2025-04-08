import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsNotEmpty } from 'class-validator';

export class FundWalletDto {
    @ApiProperty({
      example: 'USD',
      description: 'Currency to fund the wallet with (e.g., NGN, USD, EUR)',
    })
    @IsString()
    @IsNotEmpty()
    currency: string;
  
    @ApiProperty({
      example: 100.50,
      description: 'Amount to be funded into the wallet',
    })
    @IsNumber()
    @IsNotEmpty()
    amount: number;
  }
  

  export class AdminFundWalletDto {
    @ApiProperty({
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'UUID of the user whose wallet is to be funded',
    })
    @IsUUID()
    @IsNotEmpty()
    userId: string;
  
    @ApiProperty({
      example: 'NGN',
      description: 'Currency to fund the user\'s wallet with (e.g., NGN, USD, EUR)',
    })
    @IsString()
    @IsNotEmpty()
    currency: string;
  
    @ApiProperty({
      example: 2500.00,
      description: 'Amount to be funded by admin into the user\'s wallet',
    })
    @IsNumber()
    @IsNotEmpty()
    amount: number;
  }
  
