import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WinstonLogger } from '../common/logger/winston.logger';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLogger,
  ) {}

  async findAll(): Promise<User[]> {
    this.logger.log('Fetching all users');
    return this.prisma.user.findMany();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      this.logger.warn(`User lookup failed: ID ${id} not found`);
      throw new NotFoundException(`User #${id} not found`);
    }

    return user;
  }

  async remove(id: number): Promise<User> {
    this.logger.warn(`Deleting user with ID: ${id}`);
    try {
      return await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to delete user ${id}`, (error as Error).stack);
      throw new NotFoundException(
        `User #${id} not found or could not be deleted`,
      );
    }
  }
}
