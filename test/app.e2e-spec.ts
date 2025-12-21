import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// Response interfaces
interface AuthResponse {
  accessToken: string;
}

interface UserResponse {
  id: number;
  email?: string;
  role: string;
  salary?: number;
}

interface DocumentResponse {
  id: number;
  ownerId: number;
}

describe('ABAC System - Challenge Requirements (E2E)', () => {
  let app: INestApplication;

  // Tokens
  let userToken: string;
  let managerToken: string;
  let adminToken: string;

  // IDs
  let targetUserId: number;
  let targetDocId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    // 1. Register Regular User (Resource Owner)
    const userRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `user_${Date.now()}@test.com`,
        password: 'password123',
        name: 'Regular User',
        role: 'USER',
        salary: 50000, // Sensible info
      })
      .expect(201);
    userToken = (userRes.body as AuthResponse).accessToken;

    // 2. Register Manager (Attribute Viewer)
    const managerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `manager_${Date.now()}@test.com`,
        password: 'password123',
        name: 'Manager',
        role: 'MANAGER',
      })
      .expect(201);
    managerToken = (managerRes.body as AuthResponse).accessToken;

    // 3. Register Admin (Endpoint Master)
    const adminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `admin_${Date.now()}@test.com`,
        password: 'password123',
        name: 'The Admin',
        role: 'ADMIN',
      })
      .expect(201);
    adminToken = (adminRes.body as AuthResponse).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should login successfully and return a token', async () => {
      const loginEmail = `login_test_${Date.now()}@test.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: loginEmail,
          password: 'password123',
          name: 'Login Tester',
          role: 'USER',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: loginEmail,
          password: 'password123',
        })
        .expect(200);

      const body = res.body as AuthResponse;
      expect(body.accessToken).toBeDefined();
    });
  });

  describe('Resource Authorization', () => {
    it('Setup: the user creates a resource', async () => {
      const res = await request(app.getHttpServer())
        .post('/documents')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'My Private Doc', content: 'Secret' })
        .expect(201);

      const body = res.body as DocumentResponse;
      targetDocId = body.id;
      targetUserId = body.ownerId;
    });

    it('PASS: the user accesses his own resource', async () => {
      await request(app.getHttpServer())
        .get(`/documents/${targetDocId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('FAILURE: Manager (Different User) tries to access User document', async () => {
      // a manager cannot access the documents from another user
      await request(app.getHttpServer())
        .get(`/documents/${targetDocId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent document', async () => {
      await request(app.getHttpServer())
        .get('/documents/999999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('Attribute Authorization', () => {
    it('Manager queries User Profile: Sees Email, Salary is HIDDEN', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${targetUserId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);

      const body = res.body as UserResponse;

      // Requirement: Manager sees name/email, NOT salary
      expect(body.email).toBeDefined();
      expect(body.salary).toBeUndefined();
    });

    it('Admin queries User Profile: Sees EVERYTHING', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as UserResponse;

      // Requirement: Admin sees confidential data
      expect(body.email).toBeDefined();
      expect(body.salary).toBeDefined();
      expect(body.salary).toBe(50000);
    });
  });

  describe('Endpoint Authorization', () => {
    // Create a FRESH user for deletion tests
    let userToDeleteId: number;

    it('Setup: Create a disposable user for deletion', async () => {
      // Create user using a separate request to ensure clean state
      const setupEmail = `delete_me_${Date.now()}@test.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: setupEmail,
          password: 'password123',
          name: 'Disposable User',
          role: 'USER',
        })
        .expect(201);

      // Admin finds the user to delete
      const listRes = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const users = listRes.body as UserResponse[];
      const user = users.find((u) => u.email && u.email.includes(setupEmail));

      if (!user) throw new Error('Could not find disposable user');
      userToDeleteId = user.id;
    });

    it('FAIL: Manager tries to delete admin user', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userToDeleteId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);
    });

    it('PASS: Admins can delete users', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('Verify Deletion: Resource is gone', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
