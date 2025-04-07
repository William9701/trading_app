import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserSession } from '../entities/session.entity';
import { Wallet } from './wallet.entity';
import { UserRole } from '../user/user-role.enum'; // Assuming the enum is in this file

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column()
  verifyToken: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  // Using the enum for role
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER, // Default role is "user"
  })
  role: UserRole;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  wallet: Wallet;
}
