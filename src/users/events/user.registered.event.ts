import { Role } from '@prisma/client';

export class UserRegisteredEvent {
  constructor(
    public readonly userId: number,
    public readonly email: string,
    public readonly role: Role,
    public readonly hasPii: boolean,
  ) {}
}
