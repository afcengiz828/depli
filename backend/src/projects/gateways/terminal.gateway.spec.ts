import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TerminalGateway } from './terminal.gateway';
import { WsAuthService } from '../guards/ws-auth.service';
import { TerminalService } from '../services/terminal.service';

describe('TerminalGateway', () => {
    let gateway: TerminalGateway;
    let mockWsAuthService: any;
    let mockTerminalService: any;

    const testUserId = 'user-uuid-123';
    const testProjectId = 'project-uuid-456';
    const testServiceName = 'backend';

const createMockClient = () => ({
    emit: jest.fn(),
                                disconnect: jest.fn(),
                                data: {} as any,
                                handshake: {
                                    auth: { token: 'valid-token' },
                                },
});

beforeEach(async () => {
    mockWsAuthService = {
        authenticateSocket: jest.fn(),
    };

    mockTerminalService = {
        startTerminal: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            TerminalGateway,
            { provide: WsAuthService, useValue: mockWsAuthService },
            { provide: TerminalService, useValue: mockTerminalService },
        ],
    }).compile();

    gateway = module.get<TerminalGateway>(TerminalGateway);
});

describe('handleConnection', () => {
    it('should store userId on client data when authentication succeeds', () => {
        const client = createMockClient();
        mockWsAuthService.authenticateSocket.mockReturnValue({ userId: testUserId });

        gateway.handleConnection(client as any);

        expect(client.data.userId).toBe(testUserId);
        expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect client when authentication fails on connection', () => {
        const client = createMockClient();
        mockWsAuthService.authenticateSocket.mockImplementation(() => {
            throw new UnauthorizedException('No token provided');
        });

        gateway.handleConnection(client as any);

        expect(client.disconnect).toHaveBeenCalled();
    });
});

describe('handleSubscribe', () => {
    it('should start terminal session and emit output data to client', async () => {
        const client = createMockClient();
        client.data.userId = testUserId;

        const mockWriteFn = jest.fn();
        const mockStopFn = jest.fn();
        mockTerminalService.startTerminal.mockImplementation(
            async (
                projectId: string,
                userId: string,
                serviceName: string,
                onData: (chunk: string) => void,
            ) => {
                onData('$ ');
                return { write: mockWriteFn, stop: mockStopFn };
            },
        );

        await gateway.handleSubscribe(client as any, {
            projectId: testProjectId,
            serviceName: testServiceName,
        });

        expect(mockTerminalService.startTerminal).toHaveBeenCalledWith(
            testProjectId,
            testUserId,
            testServiceName,
            expect.any(Function),
        );
        expect(client.emit).toHaveBeenCalledWith('output', '$ ');
    });

    it('should store write and stop functions on client data after subscribing', async () => {
        const client = createMockClient();
        client.data.userId = testUserId;

        const mockWriteFn = jest.fn();
        const mockStopFn = jest.fn();
        mockTerminalService.startTerminal.mockResolvedValue({ write: mockWriteFn, stop: mockStopFn });

        await gateway.handleSubscribe(client as any, {
            projectId: testProjectId,
            serviceName: testServiceName,
        });

        expect(client.data.terminalWrite).toBe(mockWriteFn);
        expect(client.data.stopTerminal).toBe(mockStopFn);
    });

    it('should emit error event when subscribe fails due to project not found', async () => {
        const client = createMockClient();
        client.data.userId = testUserId;

        mockTerminalService.startTerminal.mockRejectedValue(new NotFoundException('Project not found'));

        await gateway.handleSubscribe(client as any, {
            projectId: testProjectId,
            serviceName: testServiceName,
        });

        expect(client.emit).toHaveBeenCalledWith('error', expect.objectContaining({
            message: expect.any(String),
        }));
    });

    it('should emit error event when subscribe fails due to ownership', async () => {
        const client = createMockClient();
        client.data.userId = testUserId;

        mockTerminalService.startTerminal.mockRejectedValue(
            new ForbiddenException('You do not have access to this project'),
        );

        await gateway.handleSubscribe(client as any, {
            projectId: testProjectId,
            serviceName: testServiceName,
        });

        expect(client.emit).toHaveBeenCalledWith('error', expect.objectContaining({
            message: expect.any(String),
        }));
    });
});

describe('handleInput', () => {
    it('should write input to terminal when input event is received', () => {
        const client = createMockClient();
        const mockWriteFn = jest.fn();
        client.data.terminalWrite = mockWriteFn;

        gateway.handleInput(client as any, { data: 'ls -la\n' });

        expect(mockWriteFn).toHaveBeenCalledWith('ls -la\n');
    });

    it('should not throw when input event received without active terminal session', () => {
        const client = createMockClient();
        // client.data.terminalWrite hiç set edilmemiş

        expect(() => gateway.handleInput(client as any, { data: 'ls -la\n' })).not.toThrow();
    });
});

describe('handleDisconnect', () => {
    it('should call stop function on client disconnect if terminal was active', () => {
        const client = createMockClient();
        const mockStopFn = jest.fn();
        client.data.stopTerminal = mockStopFn;

        gateway.handleDisconnect(client as any);

        expect(mockStopFn).toHaveBeenCalled();
    });

    it('should not throw when disconnect is called without active terminal', () => {
        const client = createMockClient();

        expect(() => gateway.handleDisconnect(client as any)).not.toThrow();
    });
});
});
