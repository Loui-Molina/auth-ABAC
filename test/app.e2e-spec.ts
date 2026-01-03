import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
// 1. Set ENV vars BEFORE imports to avoid any hoisting issues or side-effects
process.env.NODE_ENV = 'test';
process.env.PORT = '3333';
process.env.JWT_SECRET = 'test-secret-must-be-at-least-32-chars-long';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:password@localhost:5432/abac_db?schema=public';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { Role } from '@prisma/client';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;

  // Store tokens for reuse
  let adminToken: string;
  let managerToken: string;
  let userToken: string;
  let user2Token: string;

  // Store User IDs
  let userId: number;
  let user2Id: number;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
    authService = app.get(AuthService);

    // CLEANUP DB
    await prisma.document.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.user.deleteMany();

    // SEED USERS
    const admin = await authService.register({
      email: 'admin@test.com',
      password: 'password123',
      name: 'Admin User',
      role: Role.ADMIN,
      nationalId: 'ADMIN-ID-1',
    });
    adminToken = admin.accessToken;

    const manager = await authService.register({
      email: 'manager@test.com',
      password: 'password123',
      name: 'Manager User',
      role: Role.MANAGER,
    });
    managerToken = manager.accessToken;

    const user = await authService.register({
      email: 'user@test.com',
      password: 'password123',
      name: 'Regular User',
      role: Role.USER,
    });
    userToken = user.accessToken;
    // We need the ID for targeted tests
    const userEntity = await prisma.user.findUnique({
      where: { email: 'user@test.com' },
    });
    userId = userEntity!.id;

    const user2 = await authService.register({
      email: 'user2@test.com',
      password: 'password123',
      name: 'Other User',
      role: Role.USER,
    });
    user2Token = user2.accessToken;
    const user2Entity = await prisma.user.findUnique({
      where: { email: 'user2@test.com' },
    });
    user2Id = user2Entity!.id;
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    await app?.close();
  });

  describe('UsersController (RBAC & ABAC)', () => {
    describe('GET /users (List)', () => {
      it('should allow ADMIN to list users', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.body.length).toBeGreaterThanOrEqual(4);
          });
      });

      it('should allow MANAGER to list users', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${managerToken}`)
          .expect(200);
      });

      it('should DENY regular USER from listing users (Static Policy Check)', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403); // Forbidden by @CheckPolicies
      });
    });

    describe('GET /users/:id (Profile)', () => {
      it('should allow USER to see THEIR OWN profile', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return request(app.getHttpServer())
          .get(`/users/${userId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)
          .expect((res) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(res.body.email).toBe('user@test.com');
          });
      });

      it('should DENY USER from seeing ANOTHER user profile (Instance Check)', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return request(app.getHttpServer())
          .get(`/users/${user2Id}`) // User 1 tries to see User 2
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403); // Forbidden by Service-level check
      });

      it('should allow ADMIN to see ANY profile', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return request(app.getHttpServer())
          .get(`/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
    });

    describe('DELETE /users/:id', () => {
      it('should DENY regular USER from deleting ANY user', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return request(app.getHttpServer())
          .delete(`/users/${user2Id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });

      it('should allow ADMIN to delete a user', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return request(app.getHttpServer())
          .delete(`/users/${user2Id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });
    });
  });

  describe('DocumentsController (Resource Access)', () => {
    let docId: number;

    it('should allow USER to create a document', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'My Secret Diary',
          content: 'Top Secret',
        })
        .expect(201);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      docId = res.body.id;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(res.body.ownerId).toBe(userId);
    });

    it('should allow OWNER to read their document', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('should DENY OTHER USER from reading the document', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('should allow ADMIN to read any document (if policy allows)', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return request(app.getHttpServer())
        .get(`/documents/${docId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
