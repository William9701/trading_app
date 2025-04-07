import { EntityRepository, Repository } from 'typeorm';
import { User } from '../entities/user.entity'; // Adjust the import path as necessary

@EntityRepository(User)
export class UserRepository extends Repository<User> {}
