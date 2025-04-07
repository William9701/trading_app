import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsNotEmpty } from 'class-validator';

export class FundWalletDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currency: string; // The currency type (e.g., 'NGN', 'USD')

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number; // The amount to be funded
}
