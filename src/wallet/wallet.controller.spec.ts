import { Test, TestingModule } from '@nestjs/testing';
import { WalletController, TransactionController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { UserService } from '../user/user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { ConvertCurrencyDto } from '../dto/convert-currency.dto';
import { FundWalletDto } from '../dto/wallet.dto';
import { UserRole } from '../user/user-role.enum';

describe('WalletController', () => {
  let controller: WalletController;
  let walletService: WalletService;

  const mockWalletService = {
    getUserWallet: jest.fn(),
    fundWallet: jest.fn(),
    convertCurrency: jest.fn(),
    tradeCurrency: jest.fn(),
    getUserTransactions: jest.fn(),
  };

  const mockUser = { id: 'user-id-123', role: UserRole.USER };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        { provide: WalletService, useValue: mockWalletService },
        { provide: UserService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get<WalletController>(WalletController);
    walletService = module.get<WalletService>(WalletService);
  });

  it('should get user wallet', async () => {
    const mockWallet = { NGN: 1000 };
    mockWalletService.getUserWallet.mockResolvedValue(mockWallet);

    const result = await controller.getWallet({ user: mockUser });

    expect(result).toEqual(mockWallet);
    expect(walletService.getUserWallet).toHaveBeenCalledWith(mockUser.id);
  });

  it('should fund user wallet', async () => {
    const dto: FundWalletDto = { currency: 'NGN', amount: 5000 };
    const newBalance = { NGN: 15000 };

    mockWalletService.fundWallet.mockResolvedValue(newBalance);

    const result = await controller.fundWallet(dto, { user: mockUser });

    expect(result).toEqual({
      message: 'Wallet funded successfully',
      balance: newBalance,
    });
    expect(walletService.fundWallet).toHaveBeenCalled();
  });

  it('should convert currency in wallet', async () => {
    const dto: ConvertCurrencyDto = {
      fromCurrency: 'USD',
      toCurrency: 'NGN',
      amount: 100,
    };

    const conversionResult = {
      fromCurrency: 'USD',
      toCurrency: 'NGN',
      amount: 100,
      convertedAmount: 75000,
    };

    mockWalletService.convertCurrency.mockResolvedValue(conversionResult);

    const result = await controller.convertCurrency({ user: mockUser }, dto);

    expect(result).toEqual({
      message: 'Currency converted successfully',
      data: conversionResult,
    });
    expect(walletService.convertCurrency).toHaveBeenCalled();
  });

  it('should trade currency using cached FX rate', async () => {
    const dto: ConvertCurrencyDto = {
      fromCurrency: 'EUR',
      toCurrency: 'USD',
      amount: 50,
    };

    const tradeResult = {
      fromCurrency: 'EUR',
      toCurrency: 'USD',
      amount: 50,
      tradedAmount: 55,
    };

    mockWalletService.tradeCurrency.mockResolvedValue(tradeResult);

    const result = await controller.tradeCurrency({ user: mockUser }, dto);

    expect(result).toEqual({
      message: 'Currency traded successfully',
      data: tradeResult,
    });
    expect(walletService.tradeCurrency).toHaveBeenCalled();
  });
});

describe('TransactionController', () => {
  let controller: TransactionController;
  let walletService: WalletService;

  const mockWalletService = {
    getUserTransactions: jest.fn(),
  };

  const mockUser = { id: 'user-id-123', role: UserRole.USER };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [{ provide: WalletService, useValue: mockWalletService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get<TransactionController>(TransactionController);
    walletService = module.get<WalletService>(WalletService);
  });

  it('should get user transactions', async () => {
    const mockTransactions = [
      { amount: 100, currency: 'NGN', type: 'credit' },
      { amount: 50, currency: 'USD', type: 'debit' },
    ];

    mockWalletService.getUserTransactions.mockResolvedValue(mockTransactions);

    const result = await controller.getTransactions({ user: mockUser });

    expect(result).toEqual({
      message: 'Transactions retrieved successfully',
      data: mockTransactions,
    });
    expect(walletService.getUserTransactions).toHaveBeenCalledWith(mockUser.id);
  });
});
