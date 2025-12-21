import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JweService } from './jwe.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { WinstonLogger } from '../common/logger/winston.logger';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jweService: JweService,
    private readonly logger: WinstonLogger,
  ) {}

  /***
   * Creates a user into the system
   * */
  async register(dto: RegisterDto) {
    this.logger.log(`Registering user: ${dto.email}`);
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      this.logger.warn(`Email in use: ${dto.email}`);
      throw new BadRequestException('Email in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // ACID compliant transaction
    const user = await this.prisma.$transaction(async (tx) => {
      // 1. We create the user
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          role: dto.role,
          salary: dto.salary,
          phoneNumber: dto.phoneNumber,
          nationalId: dto.nationalId,
        },
      });

      // 2. We log the event
      await tx.auditLog.create({
        data: {
          action: 'USER_REGISTERED',
          targetId: `User:${newUser.id}`,
          payload: JSON.stringify({
            role: newUser.role,
            hasPii: !!dto.nationalId,
          }),
        },
      });

      return newUser;
    });

    this.logger.log(`User created successfully: ${user.id} (${user.role})`);
    return this.generateToken(user);
  }

  /***
   * Logs user into the system
   * */
  async login(dto: LoginDto) {
    this.logger.log(`User login into account: ${dto.email}`);
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      this.logger.warn(`Login failed: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      this.logger.warn(`Incorrect password attempt: ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  /***
   * Encrypts the payload of the token
   */
  private async generateToken(user: { id: number; email: string; role: Role }) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const token = await this.jweService.encrypt(payload);

    return { accessToken: token };
  }
}
