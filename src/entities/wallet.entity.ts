import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WalletBalance } from './wallet-balance.entity';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.wallet, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ default: 'NGN' })
  baseCurrency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => WalletBalance, (balance) => balance.wallet, {
    cascade: true,
  })
  balances: WalletBalance[];

  @OneToMany(() => Transaction, transaction => transaction.wallet)
  transactions: Transaction[];
}
