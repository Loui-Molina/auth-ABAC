import { CaslAbilityFactory } from './casl-ability.factory';
import { Role } from '@prisma/client';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { subject } from '@casl/ability';

describe('CaslAbilityFactory', () => {
  let factory: CaslAbilityFactory;

  // Mock Users
  const adminUser: AuthUser = {
    id: 1,
    email: 'admin@test.com',
    role: Role.ADMIN,
  };
  const managerUser: AuthUser = {
    id: 2,
    email: 'manager@test.com',
    role: Role.MANAGER,
  };
  const regularUser: AuthUser = {
    id: 3,
    email: 'user@test.com',
    role: Role.USER,
  };

  beforeEach(() => {
    factory = new CaslAbilityFactory();
  });

  describe('Document permissions', () => {
    it('Admin can manage everything on the system', () => {
      const ability = factory.createForUser(adminUser);
      expect(ability.can('manage', 'all')).toBe(true);
    });

    it('User can read their own doc', () => {
      const ability = factory.createForUser(regularUser);
      // Mock document
      const ownDoc = {
        id: 1,
        ownerId: 3,
        title: 'test',
        content: 'content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(ability.can('read', subject('Document', ownDoc))).toBe(true);
    });

    it('User CANNOT read anothers  document', () => {
      const ability = factory.createForUser(regularUser);
      const otherDoc = {
        id: 2,
        ownerId: 99,
        title: 'test',
        content: 'content',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(ability.cannot('read', subject('Document', otherDoc))).toBe(true);
    });
  });

  describe('User visibility', () => {
    it('Manager can list all users', () => {
      const ability = factory.createForUser(managerUser);
      expect(ability.can('aggregate', 'User')).toBe(true);
    });

    it('Regular user CANNOT list all users', () => {
      const ability = factory.createForUser(regularUser);
      expect(ability.cannot('aggregate', 'User')).toBe(true);
    });

    it('User can see their own user', () => {
      const ability = factory.createForUser(regularUser);
      const ownProfile = {
        id: 3,
        role: Role.USER,
        name: 'juan',
        salary: 90000,
        nationalId: '37373737',
        email: 'test@email.com',
        password: '<PASSWORD>',
        createdAt: new Date(),
        updatedAt: new Date(),
        phoneNumber: '123456789',
      };
      expect(ability.can('read', subject('User', ownProfile))).toBe(true);
    });
  });
});
