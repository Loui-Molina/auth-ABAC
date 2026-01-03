import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DocumentEntity {
  @ApiProperty({ example: 1 })
  @Expose({ groups: ['public'] })
  id!: number;

  @ApiProperty({ example: 'My Document' })
  @Expose({ groups: ['public'] })
  title!: string;

  @ApiProperty({ example: 'Secret Content' })
  @Expose({ groups: ['public'] })
  content!: string;

  @ApiProperty({ example: 1, description: 'ID of the owner' })
  @Expose({ groups: ['public'] })
  ownerId!: number;

  @ApiProperty()
  @Expose({ groups: ['public'] })
  createdAt!: Date;

  @ApiProperty()
  @Expose({ groups: ['public'] })
  updatedAt!: Date;

  constructor(partial: Partial<DocumentEntity>) {
    if (partial) {
      this.id = partial.id as number;
      this.title = partial.title as string;
      this.content = partial.content as string;
      this.ownerId = partial.ownerId as number;
      this.createdAt = partial.createdAt as Date;
      this.updatedAt = partial.updatedAt as Date;
    }
  }
}
