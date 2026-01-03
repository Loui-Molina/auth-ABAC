import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { WinstonLogger } from '../common/logger/winston.logger';
import { UserRegisteredEvent } from './events/user.registered.event';

@Injectable()
export class AuditListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLogger,
  ) {}

  @OnEvent('user.registered', { async: true })
  async handleUserRegisteredEvent(event: UserRegisteredEvent) {
    this.logger.log(
      `[Audit] Handling user registration event for User ID: ${event.userId}`,
    );

    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'USER_REGISTERED',
          targetId: `User:${event.userId}`,
          payload: JSON.stringify({
            role: event.role,
            hasPii: event.hasPii,
            email: event.email,
          }),
        },
      });
    } catch (error) {
      this.logger.error(
        `[Audit] Failed to create audit log for user ${event.userId}`,
        (error as Error).stack,
      );
    }
  }
}
