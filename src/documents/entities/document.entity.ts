import { Expose } from 'class-transformer';

export class DocumentEntity {
  @Expose({ groups: ['public'] })
  id: number;

  @Expose({ groups: ['public'] })
  title: string;

  @Expose({ groups: ['public'] })
  content: string;

  @Expose({ groups: ['public'] })
  ownerId: number;

  @Expose({ groups: ['public'] })
  createdAt: Date;

  @Expose({ groups: ['public'] })
  updatedAt: Date;

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
