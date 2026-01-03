import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WinstonLogger } from '../common/logger/winston.logger';
import { User } from '@prisma/client';
import { UserRepository } from './interfaces/user.repository.interface';
import { subject } from '@casl/ability';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: WinstonLogger,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async findAll(): Promise<Partial<User>[]> {
    this.logger.log('Fetching all users');
    return this.userRepository.findAll();
  }

  async findOne(id: number, requestingUser: AuthUser): Promise<Partial<User>> {
    this.logger.debug(`Fetching user profile with ID: ${id}`);
    const user = await this.userRepository.findById(id);

    if (!user) {
      this.logger.warn(`User lookup failed: ID ${id} not found`);
      throw new NotFoundException(`User #${id} not found`);
    }

    // 1. Create ability for the specific user
    const ability = this.caslAbilityFactory.createForUser(requestingUser);

    // 2. Instance Check: Can this user read THIS specific user?
    if (ability.cannot('read', subject('User', user))) {
      this.logger.warn(
        `User ${requestingUser.id} tried to access User ${id} without permission`,
      );
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return user;
  }

  async remove(id: number, requestingUser: AuthUser): Promise<User> {
    this.logger.log(`Request to delete user with ID: ${id}`);

    // Fetch first to ensure existence AND check permissions
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    const ability = this.caslAbilityFactory.createForUser(requestingUser);

    if (ability.cannot('delete', subject('User', user))) {
      throw new ForbiddenException(
        'You do not have permission to delete this user',
      );
    }

    try {
      return await this.userRepository.delete(id);
    } catch (error) {
      this.logger.error(`Failed to delete user ${id}`, (error as Error).stack);
      throw new NotFoundException(
        `User #${id} not found or could not be deleted`,
      );
    }
  }
}
