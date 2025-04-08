import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from './wallet.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Wallet } from '../entities/wallet.entity';
import { WalletBalance } from '../entities/wallet-balance.entity';
import { Transaction, TransactionType, TransactionStatus } from '../entities/transaction.entity';
import { FxRateService } from '../fx/fx-rate.service';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
import { User } from '../entities/user.entity';

jest.mock('../utils/idempotency.util', () => ({
  checkDuplicateTransaction: jest.fn().mockResolvedValue(null), // Default to no duplicates
}));

describe('WalletService', () => {
  let service: WalletService;
  let walletRepo: Repository<Wallet>;
  let balanceRepo: Repository<WalletBalance>;
  let transactionRepo: Repository<Transaction>;
  let fxRateService: FxRateService;

  const mockWalletRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockBalanceRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTransactionRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockFxRateService = {
    getRate: jest.fn(),
    getRates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: getRepositoryToken(Wallet), useValue: mockWalletRepo },
        { provide: getRepositoryToken(WalletBalance), useValue: mockBalanceRepo },
        { provide: getRepositoryToken(Transaction), useValue: mockTransactionRepo },
        { provide: FxRateService, useValue: mockFxRateService },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
    walletRepo = module.get(getRepositoryToken(Wallet));
    balanceRepo = module.get(getRepositoryToken(WalletBalance));
    transactionRepo = module.get(getRepositoryToken(Transaction));
    fxRateService = module.get(FxRateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('tradeCurrency', () => {
    it('should throw if wallet not found', async () => {
      mockWalletRepo.findOne.mockResolvedValue(null);

      await expect(
        service.tradeCurrency('user123', {
          fromCurrency: 'USD',
          toCurrency: 'NGN',
          amount: 100,
        }, 'ref1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should complete trade with sufficient balance and update balances', async () => {
      mockWalletRepo.findOne.mockResolvedValue({
        id: 1,
        balances: [
          { currency: 'USD', amount: 200 },
          { currency: 'NGN', amount: 1000 },
        ],
      });

      mockFxRateService.getRate.mockResolvedValue(1000);
      mockBalanceRepo.save.mockResolvedValue({});
      mockTransactionRepo.create.mockReturnValue({});
      mockTransactionRepo.save.mockResolvedValue({});

      const result = await service.tradeCurrency(
        'user123',
        { fromCurrency: 'USD', toCurrency: 'NGN', amount: 100 },
        'ref2',
      );

      expect(result.message).toBe('Trade successful');
    });
  });

  describe('convertCurrency', () => {
    it('should throw if insufficient balance', async () => {
      mockWalletRepo.findOne.mockResolvedValue({
        balances: [
          { currency: 'USD', amount: 50 }, // insufficient
        ],
      });

      await expect(
        service.convertCurrency('user123', {
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          amount: 100,
        }, 'ref3'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should convert currency and create transaction', async () => {
      mockWalletRepo.findOne.mockResolvedValue({
        balances: [
          { currency: 'USD', amount: 200 },
          { currency: 'EUR', amount: 50 },
        ],
      });
      mockFxRateService.getRate.mockResolvedValue(0.85);
      mockBalanceRepo.save.mockResolvedValue({});
      mockTransactionRepo.create.mockReturnValue({});
      mockTransactionRepo.save.mockResolvedValue({});

      const result = await service.convertCurrency(
        'user123',
        { fromCurrency: 'USD', toCurrency: 'EUR', amount: 100 },
        'ref4',
      );

      expect(result.message).toBe('Conversion successful');
    });
  });

  describe('fundWallet', () => {
    it('should throw if amount is <= 0', async () => {
      await expect(service.fundWallet('user123', 'USD', 0, 'ref5')).rejects.toThrow(
        'Amount must be greater than zero',
      );
    });

    it('should fund wallet and create transaction', async () => {
      mockFxRateService.getRates.mockResolvedValue({});
      mockWalletRepo.findOne.mockResolvedValue({
        balances: [{ currency: 'USD', amount: 100 }],
      });
      mockTransactionRepo.findOne.mockResolvedValue(null);
      mockTransactionRepo.create.mockReturnValue({});
      mockTransactionRepo.save.mockResolvedValue({});
      mockBalanceRepo.save.mockResolvedValue({});

      const result = await service.fundWallet('user123', 'USD', 100, 'ref6');
      expect(result.message).toBe('Wallet funded successfully');
    });
  });

  
});
