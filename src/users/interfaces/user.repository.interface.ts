import { User, Prisma } from '@prisma/client';

export abstract class UserRepository {
  abstract create(data: Prisma.UserCreateInput): Promise<User>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: number): Promise<User | null>;
  abstract findAll(): Promise<Partial<User>[]>;
  abstract delete(id: number): Promise<User>;
}
