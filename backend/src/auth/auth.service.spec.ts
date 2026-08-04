import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { verifyPassword, hashPassword } from './utils/password.util';


describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: Partial<Record<keyof Repository<User>, jest.Mock>>;
  let mockJwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    // ... (mevcut register testlerin, aynı kalıyor)
  });

  describe('login', () => {
    it('should reject login with incorrect password', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'uuid-1234',
        email: 'test@depli.com',
        password: await hashPassword('correctPassword'),
      });

      await expect(
        service.login('test@depli.com', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return a JWT token on successful login', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'uuid-1234',
        email: 'test@depli.com',
        password: await hashPassword('correctPassword'),
      });

      const result = await service.login('test@depli.com', 'correctPassword');

      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(result.accessToken).toEqual('fake-jwt-token');
    });
  });
});