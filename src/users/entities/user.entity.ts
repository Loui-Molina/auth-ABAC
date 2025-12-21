import { Expose } from 'class-transformer';
import { Role } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty({ example: 1 })
  @Expose({ groups: ['public'] })
  id: number;

  @ApiProperty({ enum: Role, example: 'USER' })
  @Expose({ groups: ['public'] })
  role: Role;

  @ApiPropertyOptional({ example: 'John Doe', nullable: true })
  @Expose({ groups: ['public'] })
  name: string | null;

  @ApiProperty({ example: 'user@example.com' })
  @Expose({ groups: ['privileged', 'confidential'] })
  email: string;

  @ApiPropertyOptional({
    example: 50000,
    description: 'Confidential: Admin/Owner only',
    nullable: true,
  })
  @Expose({ groups: ['confidential'] })
  salary: number | null;

  @ApiPropertyOptional({ example: '+1-555-0199', nullable: true })
  @Expose({ groups: ['privileged', 'confidential'] })
  phoneNumber: string | null;

  @ApiPropertyOptional({
    example: 'ID-123456',
    description: 'Confidential: Admin/Owner only',
    nullable: true,
  })
  @Expose({ groups: ['confidential'] })
  nationalId: string | null;

  @ApiProperty()
  @Expose({ groups: ['public'] })
  createdAt: Date;

  @ApiProperty()
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
