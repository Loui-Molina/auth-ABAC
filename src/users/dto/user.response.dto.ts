import { Expose, Type } from 'class-transformer';
import { Role } from '@prisma/client';

export class UserResponseDto {
  constructor(
    id: number,
    name: string,
    email: string,
    role: Role,
    createdAt: Date,
    phoneNumber: string,
    nationalId: string,
    salary?: number,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.role = role;
    this.createdAt = createdAt;
    this.salary = salary ?? null;
    this.phoneNumber = phoneNumber;
    this.nationalId = nationalId;
  }

  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  role: Role;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @Expose({ groups: ['privileged'] })
  salary: number | null;

  @Expose({ groups: ['privileged'] })
  phoneNumber: string | null;

  @Expose({ groups: ['confidential'] })
  nationalId: string | null;
}
