import {
  Ability,
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Document, Role, User } from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

type Subjects = User | Document | 'User' | 'Document' | 'all';

export type AppAbility = Ability<[string, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthUser) {
    const { can, build } = new AbilityBuilder<AppAbility>(
      Ability as AbilityClass<AppAbility>,
    );

    if (user.role === Role.ADMIN) {
      // Admin can do everything
      can('manage', 'all');
    } else if (user.role === Role.MANAGER) {
      // Manager can read all users but not manage them
      can('read', 'User');
      can('aggregate', 'User');
      can('read', 'Document');
    } else {
      // --- REGULAR USER PERMISSIONS ---

      // 1. User Profile
      can('read', 'User', { id: user.id });

      // 2. Documents
      can('create', 'Document');
      // Can only read/update/delete THEIR OWN documents
      can(['read', 'update', 'delete'], 'Document', { ownerId: user.id });
    }

    return build({
      detectSubjectType: (item) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        if (item['__caslSubjectType__']) return item['__caslSubjectType__'];
        return item.constructor as unknown as ExtractSubjectType<Subjects>;
      },
    });
  }
}
