import { Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FxRateService {
  private readonly BASE_URL = 'https://open.er-api.com/v6/latest';

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private httpService: HttpService,
    private configService: ConfigService
  ) {}

  async getRates(base: string = 'NGN'): Promise<any> {
    const cacheKey = `fx-rates-${base}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const response = await this.httpService.axiosRef.get(`${this.BASE_URL}/${base}`);
    const rates = response.data;

    await this.cacheManager.set(cacheKey, rates, 60 * 10); // cache for 10 minutes

    return rates;
  }

    /**
     * Fetches the exchange rate from one currency to another.
     * @param fromCurrency The base currency.
     * @param toCurrency The target currency.
     * @returns The exchange rate.
     */

    async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
        if (fromCurrency === toCurrency) return 1;

        const ratesData = await this.getRates(fromCurrency);

        if (!ratesData || !ratesData.rates || !ratesData.rates[toCurrency]) {
        throw new Error(`Exchange rate from ${fromCurrency} to ${toCurrency} not available`);
        }

        return ratesData.rates[toCurrency];
    }

}
