import { Expose, Type } from 'class-transformer';
import { Role } from '@prisma/client';

export class UserResponseDto {
  @Expose()
  id!: number;

  @Expose()
  email!: string;

  @Expose()
  name!: string;

  @Expose()
  role!: Role;

  @Expose()
  @Type(() => Date)
  createdAt!: Date;

  @Expose({ groups: ['privileged'] })
  salary!: number | null;

  @Expose({ groups: ['privileged'] })
  phoneNumber!: string | null;

  @Expose({ groups: ['confidential'] })
  nationalId!: string | null;
}
