import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JweService } from './jwe.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { WinstonLogger } from '../common/logger/winston.logger';
import { Role } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRegisteredEvent } from '../users/events/user.registered.event';
import { UserRepository } from '../users/interfaces/user.repository.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jweService: JweService,
    private readonly logger: WinstonLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /***
   * Creates a user into the system
   * */
  async register(dto: RegisterDto) {
    this.logger.log(`Registering user: ${dto.email}`);

    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      this.logger.warn(`Email in use: ${dto.email}`);
      throw new BadRequestException('Email in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 1. Create User via Repository
    const newUser = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      role: dto.role,
      salary: dto.salary,
      phoneNumber: dto.phoneNumber,
      nationalId: dto.nationalId,
    });

    // 2. Decoupled Side Effect: Emit Event
    this.eventEmitter.emit(
      'user.registered',
      new UserRegisteredEvent(
        newUser.id,
        newUser.email,
        newUser.role,
        !!dto.nationalId,
      ),
    );

    this.logger.log(
      `User created successfully: ${newUser.id} (${newUser.role})`,
    );
    return this.generateToken(newUser);
  }

  /***
   * Logs user into the system
   * */
  async login(dto: LoginDto) {
    this.logger.log(`User login attempt: ${dto.email}`);

    const user = await this.userRepository.findByEmail(dto.email);
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
