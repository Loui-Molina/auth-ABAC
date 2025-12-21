import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { resolve } from 'path';

@Injectable()
export class WinstonLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    const logDirectory =
      this.configService.get<string>('app.logDirectory') || 'logs';
    const nodeEnv = this.configService.get<string>('app.nodeEnv');
    const logsPath = resolve(__dirname, '../../..', logDirectory);

    const logLevel = nodeEnv === 'development' ? 'info' : 'warn';

    const dailyRotateFile = new DailyRotateFile({
      level: logLevel,
      dirname: logsPath,
      filename: '%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      handleExceptions: true,
      maxSize: '20m',
      maxFiles: '14d',
    });

    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          level: logLevel,
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.ms(),
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, ms, stack }) => {
                return `${timestamp as string} ${level}: ${message as string} ${ms as string} ${(stack as string) || ''}`;
              },
            ),
          ),
        }),
        dailyRotateFile,
      ],
      exitOnError: false,
    });
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string, trace?: string) {
    this.logger.error(message, { trace });
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }

  verbose(message: string) {
    this.logger.verbose(message);
  }
}
