import { Controller, Delete, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { plainToInstance } from 'class-transformer';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UserResponseDto } from './dto/user.response.dto';
import { getSerializationGroups } from '../common/serialization.utility';
import { PoliciesGuard } from '../casl/policies/guard';
import { CheckPolicies } from '../casl/policies/check.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard, PoliciesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  @CheckPolicies((ability) => ability.can('aggregate', 'User'))
  async findAll(@Req() req: AuthenticatedRequest): Promise<UserResponseDto[]> {
    const users = await this.usersService.findAll();

    const groups = getSerializationGroups(req.user);

    return plainToInstance(UserResponseDto, users, {
      excludeExtraneousValues: true,
      groups: groups,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.findOne(+id, req.user);

    // Pass 'user' as targetResource to automatically check if (user.id === req.user.id)
    const groups = getSerializationGroups(req.user, user as { id: number });

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      groups: groups,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.remove(+id, req.user);

    const groups = getSerializationGroups(req.user, user as { id: number });

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
      groups: groups,
    });
  }
}
