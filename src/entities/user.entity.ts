import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserSession } from '../entities/session.entity';

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

  @OneToMany(() => UserSession, (session) => session.user)
  sessions: UserSession[];
}
