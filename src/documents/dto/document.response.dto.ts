import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../../users/dto/user.response.dto';

export class DocumentResponseDto {
  constructor(
    id: number,
    title: string,
    content: string,
    ownerId: number,
    owner: UserResponseDto,
    createdAt: Date,
  ) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.ownerId = ownerId;
    this.owner = owner;
    this.createdAt = createdAt;
  }

  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  ownerId: number;

  @Expose()
  @Type(() => UserResponseDto)
  owner: UserResponseDto;

  @Expose()
  @Type(() => Date)
  createdAt: Date;
}
