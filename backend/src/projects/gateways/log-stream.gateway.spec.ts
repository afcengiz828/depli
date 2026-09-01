import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LogStreamGateway } from './log-stream.gateway';
import { WsAuthService } from '../guards/ws-auth.service';
import { LogStreamService } from '../services/log-stream.service';

describe('LogStreamGateway', () => {
    let gateway: LogStreamGateway;
    let mockWsAuthService: any;
    let mockLogStreamService: any;

    const testUserId = 'user-uuid-123';
    const testProjectId = 'project-uuid-456';

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

    mockLogStreamService = {
        startStreaming: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            LogStreamGateway,
            { provide: WsAuthService, useValue: mockWsAuthService },
            { provide: LogStreamService, useValue: mockLogStreamService },
        ],
    }).compile();

    gateway = module.get<LogStreamGateway>(LogStreamGateway);
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
    it('should start streaming and emit log data to client', async () => {
        const client = createMockClient();
        client.data.userId = testUserId;

        const mockStopFn = jest.fn();
        mockLogStreamService.startStreaming.mockImplementation(
            async (projectId: string, userId: string, onData: (chunk: string) => void) => {
                onData('backend | Server started\n');
                return { stop: mockStopFn };
            },
        );

        await gateway.handleSubscribe(client as any, { projectId: testProjectId });

        expect(mockLogStreamService.startStreaming).toHaveBeenCalledWith(
            testProjectId,
            testUserId,
            expect.any(Function),
        );
        expect(client.emit).toHaveBeenCalledWith('log', 'backend | Server started\n');
    });

    it('should store the stop function on client data after subscribing', async () => {
        const client = createMockClient();
        client.data.userId = testUserId;

        const mockStopFn = jest.fn();
        mockLogStreamService.startStreaming.mockResolvedValue({ stop: mockStopFn });

        await gateway.handleSubscribe(client as any, { projectId: testProjectId });

        expect(client.data.stopStreaming).toBe(mockStopFn);
    });

    it('should emit error event when subscribe fails due to project not found', async () => {
        const client = createMockClient();
        client.data.userId = testUserId;

        mockLogStreamService.startStreaming.mockRejectedValue(new NotFoundException('Project not found'));

        await gateway.handleSubscribe(client as any, { projectId: testProjectId });

        expect(client.emit).toHaveBeenCalledWith('error', expect.objectContaining({
            message: expect.any(String),
        }));
    });

    it('should emit error event when subscribe fails due to ownership', async () => {
        const client = createMockClient();
        client.data.userId = testUserId;

        mockLogStreamService.startStreaming.mockRejectedValue(
            new ForbiddenException('You do not have access to this project'),
        );

        await gateway.handleSubscribe(client as any, { projectId: testProjectId });

        expect(client.emit).toHaveBeenCalledWith('error', expect.objectContaining({
            message: expect.any(String),
        }));
    });
});

describe('handleDisconnect', () => {
    it('should call stop function on client disconnect if streaming was active', () => {
        const client = createMockClient();
        const mockStopFn = jest.fn();
        client.data.stopStreaming = mockStopFn;

        gateway.handleDisconnect(client as any);

        expect(mockStopFn).toHaveBeenCalled();
    });

    it('should not throw when disconnect is called without active streaming', () => {
        const client = createMockClient();
        // client.data.stopStreaming hiç set edilmemiş

        expect(() => gateway.handleDisconnect(client as any)).not.toThrow();
    });
});
});
