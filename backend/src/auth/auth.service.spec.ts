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
    it('should create a new user with a hashed password', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);
      (mockUserRepository.save as jest.Mock).mockImplementation((user) =>
        Promise.resolve({ id: 'uuid-1234', ...user }),
      );

      const result = await service.register('test@depli.com', 'mySecret123');

      expect(mockUserRepository.save).toHaveBeenCalled();
      const savedUser = (mockUserRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedUser.password).not.toEqual('mySecret123');
      expect(result.email).toEqual('test@depli.com');
    });

    it('should reject registration if email already exists', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'existing-uuid',
        email: 'test@depli.com',
      });

      await expect(
        service.register('test@depli.com', 'mySecret123'),
      ).rejects.toThrow(ConflictException);
    });
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

  describe('resetPassword', () => {
  it('should update password with a valid reset token', async () => {
    const futureDate = new Date(Date.now() + 3600 * 1000); // 1 saat sonra

    (mockUserRepository.findOne as jest.Mock).mockResolvedValue({
      id: 'uuid-1234',
      email: 'test@depli.com',
      resetPasswordToken: 'valid-token',
      resetPasswordExpiry: futureDate,
    });
    (mockUserRepository.save as jest.Mock).mockImplementation((user) =>
      Promise.resolve(user),
    );

    await service.resetPassword('valid-token', 'newPassword123');

    const savedUser = (mockUserRepository.save as jest.Mock).mock.calls[0][0];
    expect(savedUser.password).not.toEqual('newPassword123');
    expect(savedUser.resetPasswordToken).toBeNull();
  });

  it('should reject an invalid reset token', async () => {
    (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.resetPassword('invalid-token', 'newPassword123'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject an expired reset token', async () => {
    const pastDate = new Date(Date.now() - 3600 * 1000); // 1 saat önce

    (mockUserRepository.findOne as jest.Mock).mockResolvedValue({
      id: 'uuid-1234',
      email: 'test@depli.com',
      resetPasswordToken: 'valid-token',
      resetPasswordExpiry: pastDate,
    });

    await expect(
      service.resetPassword('valid-token', 'newPassword123'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
});