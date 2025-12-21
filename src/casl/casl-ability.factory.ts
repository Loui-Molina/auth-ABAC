import { AbilityBuilder, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { Injectable } from '@nestjs/common';
import { Document, Role, User } from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth-user.interface'; // Import AuthUser

export type AppSubjects =
  | Subjects<{
      User: User;
      Document: Document;
    }>
  | 'all';

export type AppAbility = PureAbility<[string, AppSubjects], PrismaQuery>;

/***
 * We use CASL to manage user permissions
 * */
@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthUser) {
    const { can, build } = new AbilityBuilder<AppAbility>(createPrismaAbility);

    if (user.role === Role.ADMIN) {
      // Admin has total control
      can('manage', 'all');
    } else {
      // Regular user can access their own documents
      can(['read', 'update', 'delete'], 'Document', { ownerId: user.id });

      if (user.role === Role.MANAGER) {
        // Manager can see user profiles without sensible info
        can('read', 'User');
        // Manager can list all users
        can('aggregate', 'User');
      } else {
        // Regular user can see their own profile
        can('read', 'User', { id: user.id });
      }
    }

    return build();
  }
}
