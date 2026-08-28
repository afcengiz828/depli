import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { WsAuthService } from './ws-auth.service';

describe('WsAuthService', () => {
    let service: WsAuthService;
    let mockJwtService: any;

    beforeEach(async () => {
        mockJwtService = {
            verify: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WsAuthService,
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        service = module.get<WsAuthService>(WsAuthService);
    });

    describe('authenticateSocket', () => {
        it('should return userId when token is valid', () => {
            const mockSocket = {
                handshake: {
                    auth: { token: 'valid-jwt-token' },
                },
            };

            mockJwtService.verify.mockReturnValue({ sub: 'user-uuid-123', email: 'test@depli.com' });

            const result = service.authenticateSocket(mockSocket as any);

            expect(result).toEqual({ userId: 'user-uuid-123' });
        });

        it('should call jwtService.verify with the correct token', () => {
            const mockSocket = {
                handshake: {
                    auth: { token: 'valid-jwt-token' },
                },
            };

            mockJwtService.verify.mockReturnValue({ sub: 'user-uuid-123' });

            service.authenticateSocket(mockSocket as any);

            expect(mockJwtService.verify).toHaveBeenCalledWith('valid-jwt-token');
        });

        it('should throw UnauthorizedException when token is missing', () => {
            const mockSocket = {
                handshake: {
                    auth: {},
                },
            };

            expect(() => service.authenticateSocket(mockSocket as any)).toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when auth object is missing entirely', () => {
            const mockSocket = {
                handshake: {},
            };

            expect(() => service.authenticateSocket(mockSocket as any)).toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when token is invalid or expired', () => {
            const mockSocket = {
                handshake: {
                    auth: { token: 'invalid-or-expired-token' },
                },
            };

            mockJwtService.verify.mockImplementation(() => {
                throw new Error('jwt expired');
            });

            expect(() => service.authenticateSocket(mockSocket as any)).toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when token payload has no sub field', () => {
            const mockSocket = {
                handshake: {
                    auth: { token: 'malformed-payload-token' },
                },
            };

            mockJwtService.verify.mockReturnValue({ email: 'test@depli.com' }); // sub eksik

            expect(() => service.authenticateSocket(mockSocket as any)).toThrow(UnauthorizedException);
        });
    });
});
