import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JweService } from './jwe.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JweService],
  exports: [JweService, AuthService],
})
export class AuthModule {}
