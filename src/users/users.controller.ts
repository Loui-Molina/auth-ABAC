import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { UsersService } from './users.service';
import { RoleSerializerInterceptor } from '../common/interceptors/role-serializer.interceptor';
import { UserEntity } from './entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { subject } from '@casl/ability';
import { User } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
@UseInterceptors(RoleSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Get()
  @ApiOperation({ summary: 'View all users (Managers/Admins)' })
  async findAll(@Req() req: AuthenticatedRequest): Promise<UserEntity[]> {
    if (!req.user) throw new ForbiddenException();

    const ability = this.caslAbilityFactory.createForUser(req.user);
    if (ability.cannot('aggregate', 'User')) {
      throw new ForbiddenException(
        'You dont have permission to view all users',
      );
    }

    const users = await this.usersService.findAll();
    return users.map((user) => new UserEntity(user));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile' })
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserEntity> {
    if (!req.user) throw new ForbiddenException();

    const ability = this.caslAbilityFactory.createForUser(req.user);

    const ghostUser = { id: +id } as User; // we check if the user is trying to access his own profile
    if (ability.cannot('read', subject('User', ghostUser))) {
      throw new ForbiddenException(
        'You do not have permission to view this profile',
      );
    }

    const user = await this.usersService.findOne(+id);

    return new UserEntity(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (Admin Only)' })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    if (!req.user) throw new ForbiddenException();

    const ability = this.caslAbilityFactory.createForUser(req.user);

    if (ability.cannot('delete', 'User')) {
      throw new ForbiddenException('Only Admins can delete users');
    }

    await this.usersService.remove(+id);

    return { message: 'User deleted successfully' };
  }
}
