import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet) private walletRepo: Repository<Wallet>,
    @InjectRepository(WalletBalance) private balanceRepo: Repository<WalletBalance>,
  ) {}

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
  async createWalletInCurrency(userId: string, currency: string): Promise<WalletBalance> {
    // Fetch the user's wallet
    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
      relations: ['balances'],
    });

    if (!wallet) {
      throw new Error('User wallet not found');
    }

    // Check if the wallet already has the requested currency
    const existingBalance = wallet.balances.find(b => b.currency === currency);
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
  async fundWallet(userId: string, currency: string, amount: number) {
    const wallet = await this.walletRepo.findOne({
      where: { user: { id: userId } },
      relations: ['balances'],
    });
  
    if (!wallet) throw new Error('Wallet not found');
  
    let balance = wallet.balances.find(b => b.currency === currency);
  
    if (!balance) {
      const newBalance = this.balanceRepo.create({ currency, amount, wallet });
      return this.balanceRepo.save(newBalance);
    }
  
    // Convert to numbers if stored as strings
    const currentAmount = typeof balance.amount === 'string' ? parseFloat(balance.amount) : balance.amount;
  
    // Add properly and fix to 2 decimal places if needed
    balance.amount = Number((currentAmount + amount).toFixed(2));
  
    return this.balanceRepo.save(balance);
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
  
}
