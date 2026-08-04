import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth-register.service';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: Partial<Record<keyof Repository<User>, jest.Mock>>;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
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
});