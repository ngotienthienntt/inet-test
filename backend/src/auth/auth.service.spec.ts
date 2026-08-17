import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/types/index';
import { User } from '../users/entities/user.entity';

// Mock bcrypt at the module level so the non-configurable exports can be overridden
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcrypt') as { compare: jest.Mock; hash: jest.Mock };

const mockUser = (): User => ({
  id: 1,
  email: 'test@example.com',
  passwordHash: '$2b$10$hashedpassword',
  fullName: 'Test User',
  phone: '0900000000',
  role: UserRole.CUSTOMER,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            updatePasswordHash: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('creates a user and returns sanitized user + access token', async () => {
      const dto = {
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New User',
        phone: '0911111111',
      };
      const createdUser = { ...mockUser(), email: dto.email, fullName: dto.fullName };

      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(createdUser);

      const result = await service.register(dto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(usersService.create).toHaveBeenCalledWith({
        email: dto.email,
        password: dto.password,
        fullName: dto.fullName,
        phone: dto.phone,
      });
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.email).toBe(dto.email);
    });

    it('throws ConflictException when email is already taken', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser());

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Duplicate',
          phone: '0900000000',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns user and access token on valid credentials', async () => {
      const user = mockUser();
      const plainPassword = 'correctPassword';
      usersService.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.login({ email: user.email, password: plainPassword });

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.email).toBe(user.email);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const user = mockUser();
      usersService.findByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: user.email, password: 'wrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('verifies the current password and updates the hash on success', async () => {
      const user = mockUser();
      usersService.findById.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('$2b$10$newhashedpassword');

      await service.changePassword(user.id, { currentPassword: 'correctOld', newPassword: 'brandNewPass123' });

      expect(bcrypt.compare).toHaveBeenCalledWith('correctOld', user.passwordHash);
      expect(bcrypt.hash).toHaveBeenCalledWith('brandNewPass123', 10);
      expect(usersService.updatePasswordHash).toHaveBeenCalledWith(user.id, '$2b$10$newhashedpassword');
    });

    it('throws UnauthorizedException when the current password is wrong', async () => {
      const user = mockUser();
      usersService.findById.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.changePassword(user.id, { currentPassword: 'wrongOld', newPassword: 'brandNewPass123' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.updatePasswordHash).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.changePassword(999, { currentPassword: 'any', newPassword: 'brandNewPass123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateGuestToken', () => {
    it('returns an object with a sessionToken string', () => {
      const result = service.generateGuestToken();

      expect(result).toHaveProperty('sessionToken');
      expect(typeof result.sessionToken).toBe('string');
      expect(result.sessionToken.length).toBeGreaterThan(0);
    });
  });
});
