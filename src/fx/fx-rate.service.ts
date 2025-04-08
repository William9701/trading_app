import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { logger } from 'src/utils/logger.util';
@Injectable()
export class FxRateService {
  private readonly BASE_URL = 'https://open.er-api.com/v6/latest';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}
  /**
   * Fetches the latest exchange rates for a given base currency.
   * @param base The base currency.
   * @returns An object containing the exchange rates.
   */
  async getRates(base: string = 'NGN'): Promise<any> {
    logger.info(`Fetching rates for base currency: ${base}`);
    const cacheKey = `fx-rates-${base}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const response = await this.httpService.axiosRef.get(
      `${this.BASE_URL}/${base}`,
    );
    const rates = response.data;

    await this.cacheManager.set(cacheKey, rates, 60 * 10); // cache for 10 minutes

    logger.info(`Fetched rates for base currency: ${base}`);

    return rates;
  }

  /**
   * Fetches the exchange rate from one currency to another.
   * @param fromCurrency The base currency.
   * @param toCurrency The target currency.
   * @returns The exchange rate.
   */

  async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
    logger.info(
      `Fetching exchange rate from ${fromCurrency} to ${toCurrency}`,
    );
    if (fromCurrency === toCurrency) return 1;

    const ratesData = await this.getRates(fromCurrency);

    if (!ratesData || !ratesData.rates || !ratesData.rates[toCurrency]) {
      throw new Error(
        `Exchange rate from ${fromCurrency} to ${toCurrency} not available`,
      );
    }
    logger.info(
      `Fetched exchange rate from ${fromCurrency} to ${toCurrency}: ${ratesData.rates[toCurrency]}`,
    );
    return ratesData.rates[toCurrency];

  }
}
