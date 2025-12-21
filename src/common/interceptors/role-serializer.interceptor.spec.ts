import { RoleSerializerInterceptor } from './role-serializer.interceptor';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { Role } from '@prisma/client';
import { UserEntity } from '../../users/entities/user.entity';
import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';

describe('RoleSerializerInterceptor', () => {
  let interceptor: RoleSerializerInterceptor<UserEntity>;

  beforeEach(() => {
    interceptor = new RoleSerializerInterceptor();
  });

  const createMockContext = (
    userRole: Role,
    userId: number,
  ): ExecutionContext => {
    const mockUser: AuthUser = {
      id: userId,
      role: userRole,
      email: 'test@test.com',
    };

    const mockRequest = {
      user: mockUser,
    } as unknown as AuthenticatedRequest;

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
  };

  it('should hide sensitive fields for Regular User viewing another profile', (done) => {
    const context = createMockContext(Role.USER, 1);

    // User 1 viewing User 2's data
    const entity = new UserEntity({
      id: 2,
      role: Role.USER,
      salary: 50000,
      nationalId: 'SECRET',
      email: 'target@test.com',
    });

    const next: CallHandler<UserEntity> = { handle: () => of(entity) };

    interceptor.intercept(context, next).subscribe((result) => {
      const r = result as Record<string, unknown>;

      expect(r).not.toHaveProperty('salary');
      expect(r).not.toHaveProperty('nationalId');
      expect(r).toHaveProperty('id', 2);
      done();
    });
  });

  it('should SHOW sensitive fields for Owner', (done) => {
    const context = createMockContext(Role.USER, 1);

    // User 1 viewing User 1's data (Self)
    const entity = new UserEntity({
      id: 1,
      role: Role.USER,
      salary: 50000,
      nationalId: 'SECRET',
      email: 'me@test.com',
    });

    const next: CallHandler<UserEntity> = { handle: () => of(entity) };

    interceptor.intercept(context, next).subscribe((result) => {
      const r = result as Record<string, unknown>;

      expect(r).toHaveProperty('salary', 50000);
      expect(r).toHaveProperty('nationalId', 'SECRET');
      done();
    });
  });
});
