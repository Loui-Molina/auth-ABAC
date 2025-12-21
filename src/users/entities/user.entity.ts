import { Expose } from 'class-transformer';
import { Role } from '@prisma/client';

export class UserEntity {
  @Expose({ groups: ['public'] })
  id: number;

  @Expose({ groups: ['public'] })
  role: Role;

  @Expose({ groups: ['public'] })
  name: string | null;

  @Expose({ groups: ['privileged', 'confidential'] })
  email: string;

  @Expose({ groups: ['confidential'] })
  salary: number | null;

  @Expose({ groups: ['privileged', 'confidential'] })
  phoneNumber: string | null;

  @Expose({ groups: ['confidential'] })
  nationalId: string | null;

  @Expose({ groups: ['public'] })
  createdAt: Date;

  @Expose({ groups: ['public'] })
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    if (partial) {
      this.id = partial.id!;
      this.role = partial.role!;
      this.name = partial.name ?? null;
      this.email = partial.email!;
      this.salary = partial.salary ?? null;
      this.phoneNumber = partial.phoneNumber ?? null;
      this.nationalId = partial.nationalId ?? null;
      this.createdAt = partial.createdAt!;
      this.updatedAt = partial.updatedAt!;
    }
  }
}
