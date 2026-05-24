import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthJwtPayload, UserRole } from '@app/types';

import { AppLogger } from '../../logger/logger.service';
import { BlacklistService } from './blacklist.service';

// Mock constants to avoid resolution errors in isolation
jest.mock('../../../constants/system_messages', () => ({
  UNAUTHORIZED: 'Unauthorized',
}));

describe('BlacklistService', () => {
  let service: BlacklistService;

  // Create a typed mock for the cache manager
  let cacheManager: { get: jest.Mock; set: jest.Mock };

  const mockToken = 'mock.jwt.token';
  const mockPayload = {
    sub: 'user123',
    jti: 'jti123',
    exp: 2000,
  } as AuthJwtPayload;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlacklistService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          // Dummy logger provided to satisfy dependency injection
          provide: AppLogger,
          useValue: {
            setContext: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
            security: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BlacklistService>(BlacklistService);
    cacheManager = module.get(CACHE_MANAGER);

    // Lock Date.now() so TTL math is predictable during tests
    // Date.now() returns ms. Let's lock it to 1000 seconds (1,000,000 ms)
    jest.spyOn(Date, 'now').mockReturnValue(1000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('blacklistToken', () => {
    it('should cache the token if it has a positive TTL', async () => {
      // Current time is 1000s. Token exp is 2000s. TTL should be 1000s.
      await service.blacklistToken(mockToken, mockPayload);

      expect(cacheManager.set).toHaveBeenCalledTimes(1);
      expect(cacheManager.set).toHaveBeenCalledWith(
        'bl_token:jti123',
        'revoked',
        1000 * 1000, // ttl in ms
      );
    });

    it('should not cache the token if it is already expired', async () => {
      // Current time is 1000s. Token exp is 500s. TTL is -500.
      const expiredPayload: AuthJwtPayload = {
        ...mockPayload,
        exp: 500,
      };

      await service.blacklistToken(mockToken, expiredPayload);

      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('should not attempt to cache if payload is missing jti or exp', async () => {
      const invalidPayload: AuthJwtPayload = {
        sub: 'user123',
        email: 'user123@example.com',
        role: UserRole.USER,
      };

      await expect(
        service.blacklistToken(mockToken, invalidPayload),
      ).resolves.not.toThrow();
      expect(cacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('revokeAccess', () => {
    it('should return normally if token is not blacklisted', async () => {
      // Cache returns null/undefined when token is not found
      cacheManager.get.mockResolvedValue(null);

      // Note: This test will fail until the missing `return` is added to the service
      await expect(
        service.revokeAccess(mockToken, mockPayload),
      ).resolves.not.toThrow();

      expect(cacheManager.get).toHaveBeenCalledTimes(1);
      expect(cacheManager.get).toHaveBeenCalledWith('bl_token:jti123');
    });

    it('should throw UnauthorizedException if token is blacklisted', async () => {
      cacheManager.get.mockResolvedValue('revoked');

      await expect(
        service.revokeAccess(mockToken, mockPayload),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if payload is missing jti', async () => {
      const invalidPayload: AuthJwtPayload = {
        sub: 'user123',
        email: 'user123@example.com',
        role: UserRole.USER,
      };

      await expect(
        service.revokeAccess(mockToken, invalidPayload),
      ).rejects.toThrow(UnauthorizedException);

      // Should fail before hitting the cache
      expect(cacheManager.get).not.toHaveBeenCalled();
    });
  });
});
