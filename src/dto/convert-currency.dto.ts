import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConvertCurrencyDto {
  @ApiProperty({ example: 'NGN' })
  @IsString()
  fromCurrency: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  toCurrency: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  amount: number;
}
