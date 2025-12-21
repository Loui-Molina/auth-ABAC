import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import { createHash } from 'crypto';
import { WinstonLogger } from '../common/logger/winston.logger';

@Injectable()
export class JweService {
  private readonly secret: Uint8Array;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: WinstonLogger,
  ) {
    const secretStr = this.config.get<string>('app.jweSecret');

    if (!secretStr) {
      this.logger.error('FATAL: JWT_SECRET not defined');
      throw new Error('FATAL: JWT_SECRET not defined');
    }
    // We hash the secret to ensure sha256 compatibility
    this.secret = createHash('sha256').update(String(secretStr)).digest();
  }

  /***
   * we encrypt the token
   **/
  async encrypt<T extends object>(payload: T): Promise<string> {
    return new jose.CompactEncrypt(
      new TextEncoder().encode(JSON.stringify(payload)),
    )
      .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
      .encrypt(this.secret);
  }

  /***
   * we decrypt the token
   **/
  async decrypt<T>(jwe: string): Promise<T> {
    try {
      const { plaintext } = await jose.compactDecrypt(jwe, this.secret);
      const decoded = new TextDecoder().decode(plaintext);
      return JSON.parse(decoded) as T;
    } catch (err: unknown) {
      this.logger.warn(`Error decrypting token: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid or expired TOKEN');
    }
  }
}
