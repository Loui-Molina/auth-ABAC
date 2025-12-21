import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';

type PlainObject = Record<string, unknown>;
type ResponseData = PlainObject | PlainObject[];

@Injectable()
export class RoleSerializerInterceptor<
  T extends object,
> implements NestInterceptor<T, ResponseData> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseData> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    return next.handle().pipe(
      map((data: T | T[]) => {
        if (Array.isArray(data)) {
          return data.map((item) => this.transformItem(item, user));
        }
        return this.transformItem(data, user);
      }),
    );
  }

  /***
   * We verify the groups a user belongs to
   * */
  private transformItem(
    item: T,
    user?: AuthenticatedRequest['user'],
  ): PlainObject {
    if (!item || typeof item !== 'object') {
      return item as unknown as PlainObject;
    }

    // Auth by atribute
    // Everyone is on public group
    const groups: string[] = ['public'];

    if (user) {
      // Managaer is in the privileged group
      if (user.role === Role.MANAGER) {
        groups.push('privileged');
      }
      // Admin is in the privilege and confidential group
      if (user.role === Role.ADMIN) {
        groups.push('privileged', 'confidential');
      }

      // Auth by resource
      const resource = item as unknown as object;

      let isOwner = false;

      // We validate user resource ownership
      if ('ownerId' in resource) {
        const r = resource as { ownerId: number };
        if (r.ownerId === user.id) isOwner = true;
      }
      if ('id' in resource && !('ownerId' in resource)) {
        const r = resource as { id: number };
        if (r.id === user.id) isOwner = true;
      }

      if (isOwner) {
        groups.push('privileged', 'confidential');
      }
    }

    return instanceToPlain(item, {
      groups,
      excludeExtraneousValues: true,
    }) as PlainObject;
  }
}
