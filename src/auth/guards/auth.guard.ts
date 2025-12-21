import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JweService } from '../jwe.service';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jweService: JweService) {}

  /***
   * Validates the user making the request
   *  */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // We intercept the request
    const request = context.switchToHttp().getRequest<Request>();
    // We extract the token
    const token = this.extractTokenFromHeader(request);

    // We validate the token
    if (!token) {
      throw new UnauthorizedException('Could not find token');
    }

    // We decode the token
    try {
      const payload = await this.jweService.decrypt<AuthUser>(token);

      // We verify the id and role exists
      if (!payload.id || !payload.role) {
        throw new UnauthorizedException('Invalid token info');
      }

      // We inject the user into the request
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid Token');
    }
    return true;
  }

  /***
   * Checks for bearer token and extracts it
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
