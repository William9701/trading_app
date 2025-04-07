import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FxRateService } from './fx-rate.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fx')
export class FxRateController {
  constructor(private readonly fxRateService: FxRateService) {}

  @Get('rates')
  @UseGuards(JwtAuthGuard) // Protects the endpoint with JWT authentication
  @ApiOperation({ summary: 'Get rates', description: 'Get exchange rates' })
  @ApiBearerAuth() // Requires Bearer Authentication
  @ApiResponse({ status: 200, description: 'Rates retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Rates not found' })
  async getRates(@Query('base') base: string = 'NGN') {
    return this.fxRateService.getRates(base);
  }
}
