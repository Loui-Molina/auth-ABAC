import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JweService } from './jwe.service';
import { AuditListener } from '../users/audit.listener';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => UsersModule), PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, JweService, AuditListener],
  exports: [AuthService, JweService],
})
export class AuthModule {}
