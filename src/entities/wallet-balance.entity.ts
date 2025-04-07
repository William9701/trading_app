import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity()
export class WalletBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.balances, { onDelete: 'CASCADE' })
  wallet: Wallet;

  @Column()
  currency: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  amount: number;
}
