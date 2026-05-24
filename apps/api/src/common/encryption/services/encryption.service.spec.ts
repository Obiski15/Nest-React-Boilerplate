import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AppLogger } from '../../logger/logger.service';
import { EncryptionService } from './encryption.service';

describe('EncryptionService (Unit)', () => {
  let service: EncryptionService;

  const mockConfigService = {
    getOrThrow: jest
      .fn()
      .mockReturnValue('super-secret-key-that-is-at-least-32-bytes-long'),
  };

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AppLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt() and decrypt()', () => {
    it('should successfully encrypt and then decrypt a string', () => {
      const originalText = 'Hello World';
      const encrypted = service.encrypt(originalText);

      expect(encrypted).toContain(':'); // Ensure payload has IV:AuthTag:Data

      const decrypted = service.decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it('should throw InternalServerErrorException for invalid payload format', () => {
      expect(() => service.decrypt('invalid-payload')).toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('hash() and compare()', () => {
    it('should correctly hash and compare strings', () => {
      const text = 'myPassword123';
      const hash = service.hash(text);

      expect(service.compare(text, hash)).toBe(true);
      expect(service.compare('wrongPassword', hash)).toBe(false);
    });
  });
});
