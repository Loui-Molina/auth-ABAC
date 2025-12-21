import { Test, TestingModule } from '@nestjs/testing';
import { JweService } from './jwe.service';
import { ConfigService } from '@nestjs/config';
import { WinstonLogger } from '../common/logger/winston.logger';

describe('JweService', () => {
  let service: JweService;

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn().mockReturnValue('12345678901234567890123456789012'),
  };

  // Mock logger
  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JweService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: WinstonLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<JweService>(JweService);
  });

  it('Service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should encrypt and decrypt the token', async () => {
    interface TestPayload {
      id: number;
      role: string;
    }

    const payload: TestPayload = { id: 1, role: 'TEST' };

    const token = await service.encrypt<TestPayload>(payload);
    expect(typeof token).toBe('string');

    const decrypted = await service.decrypt<TestPayload>(token);
    expect(decrypted).toEqual(payload);
  });
});
