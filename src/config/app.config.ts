import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jweSecret: process.env.JWE_SECRET,
  logDirectory: process.env.LOG_DIR || 'logs',
}));
