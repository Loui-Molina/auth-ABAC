import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../../users/dto/user.response.dto';

export class DocumentResponseDto {
  @Expose()
  id!: number;

  @Expose()
  title!: string;

  @Expose()
  content!: string;

  @Expose()
  ownerId!: number;

  @Expose()
  @Type(() => UserResponseDto)
  owner!: UserResponseDto;

  @Expose()
  @Type(() => Date)
  createdAt!: Date;
}
