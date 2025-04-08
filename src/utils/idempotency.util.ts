// utils/idempotency.util.ts
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity'; // Adjust the path as needed

export async function checkDuplicateTransaction(
    repo: Repository<Transaction>,
    reference: string,
  ): Promise<Transaction | null> {
    const existing = await repo.findOne({ where: { reference } });
    return existing || null;
  }
  