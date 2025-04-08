import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { User } from '../entities/user.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../entities/transaction.entity';
import { logger } from 'src/utils/logger.util';
import { FxRateService } from '../fx/fx-rate.service';
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
import { checkDuplicateTransaction } from '../utils/idempotency.util'; // Import the utility function

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(WalletBalance)
    private balanceRepo: Repository<WalletBalance>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    private fxRateService: FxRateService, // Injecting the FxRateService to get exchange rates
  ) {}

  /**
   * Handles the trade logic, including Naira-specific rules if necessary.
   * @param userId The user's ID for the trade.
   * @param dto Contains details of the trade (fromCurrency, toCurrency, amount).
   * @returns The result of the trade.
   */
  async tradeCurrency(userId: string, dto: ConvertCurrencyDto, reference: string) {
    // Step 1: Check for duplicate transaction
    const duplicate = await checkDuplicateTransaction(this.transactionRepo, reference);
    if (duplicate) {
      logger.warn(`Duplicate conversion transaction with reference ${reference}`);
      return { message: 'Transaction already processed', transaction: duplicate };
    }
    const { fromCurrency, toCurrency, amount } = dto;

    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
      relations: ['balances'],
    });

    if (!wallet) {
      logger.error(`Wallet not found for user: ${userId}`);
      throw new BadRequestException('Wallet not found');
    }

    const fromBalance = wallet.balances.find(
      (b) => b.currency === fromCurrency,
    );
    const toBalance = wallet.balances.find((b) => b.currency === toCurrency);

    if (!fromBalance || fromBalance.amount < amount) {
      logger.warn(
        `Insufficient balance: Needed ${amount}, Available ${fromBalance?.amount ?? 0}`,
      );
      throw new BadRequestException('Insufficient balance for trade');
    }

    // Get cached FX rate
    const fxRate = await this.fxRateService.getRate(fromCurrency, toCurrency);
    if (!fxRate) {
      logger.error(`FX rate unavailable for ${fromCurrency} to ${toCurrency}`);
      throw new BadRequestException('Unable to retrieve exchange rate');
    }

    let convertedAmount = Number((amount * fxRate).toFixed(2));

    // Naira-specific trading logic (e.g., adjust FX rate or add commissions)
    if (fromCurrency === 'NGN') {
      // Example: Deduct a small trading fee if trading from Naira
      const tradingFee = 0.02; // 2% fee
      convertedAmount = convertedAmount * (1 - tradingFee);
      logger.info(
        `Applied 2% trading fee for NGN trade. New converted amount: ${convertedAmount}`,
      );
    }

    // Update the fromBalance and toBalance
    fromBalance.amount = Number((fromBalance.amount - amount).toFixed(2));

    if (toBalance) {
      const currentAmount =
        typeof toBalance.amount === 'number'
          ? toBalance.amount
          : parseFloat(toBalance.amount); // Safely handle string

      toBalance.amount = Number((currentAmount + convertedAmount).toFixed(2));
      await this.balanceRepo.save(toBalance);
    } else {
      const newBalance = this.balanceRepo.create({
        currency: toCurrency,
        amount: convertedAmount,
        wallet,
      });
      await this.balanceRepo.save(newBalance);
    }

    await this.balanceRepo.save(fromBalance);

    // Log the transaction
    const transaction = this.transactionRepo.create({
      wallet,
      currency: fromCurrency,
      amount,
      rate: fxRate,
      type: TransactionType.TRADE,
      status: TransactionStatus.SUCCESS,
      reference,
      remarks: `Traded ${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency} at rate ${fxRate}`,
    });

    await this.transactionRepo.save(transaction);

    return {
      message: 'Trade successful',
      from: { currency: fromCurrency, deducted: amount },
      to: { currency: toCurrency, added: convertedAmount },
      rate: fxRate,
    };
  }

  /**
   * Converts an amount from one currency to another using the FX rate service.
   * @param convertCurrencyDto The DTO containing conversion details.
   * @returns The converted amount.
   */
  async convertCurrency(userId: string, dto: ConvertCurrencyDto, reference: string) {
    const duplicate = await checkDuplicateTransaction(this.transactionRepo, reference);
    if (duplicate) {
      logger.warn(`Duplicate conversion transaction with reference ${reference}`);
      return { message: 'Transaction already processed', transaction: duplicate };
    }
    const { fromCurrency, toCurrency, amount } = dto;

    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
      relations: ['balances'],
    });

    if (!wallet) {
      logger.error(`Wallet not found for user: ${userId}`);
      throw new BadRequestException('Wallet not found');
    }

    const fromBalance = wallet.balances.find(
      (b) => b.currency === fromCurrency,
    );
    const toBalance = wallet.balances.find((b) => b.currency === toCurrency);

    if (!fromBalance || fromBalance.amount < amount) {
      logger.warn(
        `Insufficient balance: Needed ${amount}, Available ${fromBalance?.amount ?? 0}`,
      );
      throw new BadRequestException('Insufficient balance for conversion');
    }

    const fxRate = await this.fxRateService.getRate(fromCurrency, toCurrency);
    if (!fxRate) {
      logger.error(`FX rate unavailable for ${fromCurrency} to ${toCurrency}`);
      throw new BadRequestException('Unable to retrieve exchange rate');
    }

    const convertedAmount = Number((amount * fxRate).toFixed(2));

    fromBalance.amount = Number((fromBalance.amount - amount).toFixed(2));

    if (toBalance) {
      const currentAmount =
        typeof toBalance.amount === 'number'
          ? toBalance.amount
          : parseFloat(toBalance.amount); // Safely handle string

      toBalance.amount = Number((currentAmount + convertedAmount).toFixed(2));
      await this.balanceRepo.save(toBalance);
    } else {
      const newBalance = this.balanceRepo.create({
        currency: toCurrency,
        amount: convertedAmount,
        wallet,
      });
      await this.balanceRepo.save(newBalance);
    }

    await this.balanceRepo.save(fromBalance);

    const transaction = this.transactionRepo.create({
      wallet,
      currency: fromCurrency,
      amount,
      rate: fxRate,
      type: TransactionType.CONVERSION,
      status: TransactionStatus.SUCCESS,
      reference,
      remarks: `Converted ${amount} ${fromCurrency} to ${convertedAmount} ${toCurrency} at rate ${fxRate}`,
    });

    await this.transactionRepo.save(transaction);

    return {
      message: 'Conversion successful',
      from: { currency: fromCurrency, deducted: amount },
      to: { currency: toCurrency, added: convertedAmount },
      rate: fxRate,
    };
  }

  /**
   * Creates a wallet for the user with a base currency (NGN) and initial balances in USD, EUR, NGN.
   * @param user The user object that the wallet is being created for.
   */
  async createWalletForUser(user: User): Promise<Wallet> {
    const wallet = this.walletRepo.create({
      user,
      baseCurrency: 'NGN', // Default wallet currency is NGN.
      balances: [
        this.balanceRepo.create({ currency: 'NGN', amount: 0 }), // Starting with 0 balance in NGN.
        this.balanceRepo.create({ currency: 'USD', amount: 0 }), // Starting with 0 balance in USD.
        this.balanceRepo.create({ currency: 'EUR', amount: 0 }), // Starting with 0 balance in EUR.
      ],
    });

    return this.walletRepo.save(wallet);
  }

  /**
   * Allows a user to add a new wallet in a specific currency (dynamic creation).
   * @param userId The user's ID for whom the wallet is being created.
   * @param currency The currency type for the new wallet (e.g., USD, EUR).
   * @returns The created or updated wallet with the specified currency.
   */
  async createWalletInCurrency(
    userId: string,
    currency: string,
  ): Promise<WalletBalance> {
    // Fetch the user's wallet
    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
      relations: ['balances'],
    });

    if (!wallet) {
      throw new Error('User wallet not found');
    }

    // Check if the wallet already has the requested currency
    const existingBalance = wallet.balances.find(
      (b) => b.currency === currency,
    );
    if (existingBalance) {
      throw new Error(`Wallet already exists in ${currency}`);
    }

    // Create a new wallet balance entry for the specified currency
    const newBalance = this.balanceRepo.create({ currency, amount: 0, wallet });

    // Save the new wallet balance
    await this.balanceRepo.save(newBalance);

    return newBalance; // Return the new balance
  }

  /**
   * Funds a user's wallet with a given amount and currency.
   * @param userId The user's ID to fund the wallet.
   * @param currency The currency to fund (e.g., USD, EUR, NGN).
   * @param amount The amount to be added to the wallet.
   * @returns The updated wallet balance.
   */
  async fundWallet(
    userId: string,
    currency: string,
    amount: number,
    reference: string,
  ) {
    // Step 1: Check for duplicate transaction
    const existing = await this.transactionRepo.findOne({
      where: { reference },
    });
    if (existing) {
      logger.warn(
        `Duplicate fund transaction attempt with reference ${reference}`,
      );
      return {
        message: 'Transaction already processed',
        transaction: existing,
      };
    }

    // Step 2: Validate currency and amount
    try {
      await this.fxRateService.getRates(currency);
    } catch (error) {
      throw new Error(`Invalid or unsupported currency: ${currency}`);
    }

    if (amount <= 0) throw new Error('Amount must be greater than zero');

    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
      relations: ['balances'],
    });
    if (!wallet) throw new Error('Wallet not found');

    let balance = wallet.balances.find((b) => b.currency === currency);
    if (!balance) {
      balance = this.balanceRepo.create({ currency, amount, wallet });
    } else {
      balance.amount = Number(
        (parseFloat(balance.amount.toString()) + amount).toFixed(2),
      );
    }
    await this.balanceRepo.save(balance);

    const transaction = this.transactionRepo.create({
      wallet,
      currency,
      amount,
      rate: null,
      type: TransactionType.FUNDING,
      status: TransactionStatus.SUCCESS,
      reference,
      remarks: `Funded ${amount} ${currency}`,
    });
    await this.transactionRepo.save(transaction);

    return { message: 'Wallet funded successfully', transaction };
  }

  /**
   * Fetches the user's wallet by user ID.
   * @param userId The user's ID to fetch the wallet.
   * @returns The user's wallet with balances.
   */
  async getUserWallet(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
      relations: ['balances'],
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return wallet;
  }

  /**
   * Get all transactions associated with a userId, ordered by timestamp (latest first)
   * @param userId The ID of the user whose transactions we want to fetch
   */
  async getUserTransactions(userId: string) {
    try {
      // Step 1: Fetch the wallet ID associated with the userId
      const wallet = await this.walletRepo.findOne({
        where: { user: { id: userId } }, // Assuming wallet has a relation to user
      });

      if (!wallet) {
        throw new Error('Wallet not found for this user');
      }

      // Step 2: Fetch transactions for the wallet, ordered by timestamp (latest first)
      const transactions = await this.transactionRepo.find({
        where: { wallet: { id: wallet.id } },
        order: { timestamp: 'DESC' }, // Assuming the `Transaction` entity has a `timestamp` field
      });

      return transactions;
    } catch (error) {
      throw new Error(`Failed to retrieve transactions: ${error.message}`);
    }
  }
}
