import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TerminalAuditService } from './terminal-audit.service';
import { TerminalAuditLogEntity } from '../entities/terminal-audit-log.entity';

describe('TerminalAuditService', () => {
    let service: TerminalAuditService;
    let mockAuditRepository: any;

    const testProjectId = 'project-uuid-456';
    const testUserId = 'user-uuid-123';
    const testCommand = 'ls -la\n';

beforeEach(async () => {
    mockAuditRepository = {
        create: jest.fn(),
           save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            TerminalAuditService,
            { provide: getRepositoryToken(TerminalAuditLogEntity), useValue: mockAuditRepository },
        ],
    }).compile();

    service = module.get<TerminalAuditService>(TerminalAuditService);
});

describe('logCommand', () => {
    it('should save a command entry with correct fields', async () => {
        const mockEntity = { projectId: testProjectId, userId: testUserId, command: testCommand };
        mockAuditRepository.create.mockReturnValue(mockEntity);
        mockAuditRepository.save.mockResolvedValue({ id: 'log-uuid', ...mockEntity });

        await service.logCommand(testProjectId, testUserId, testCommand);

        expect(mockAuditRepository.create).toHaveBeenCalledWith({
            projectId: testProjectId,
            userId: testUserId,
            command: testCommand,
        });
        expect(mockAuditRepository.save).toHaveBeenCalledWith(mockEntity);
    });

    it('should not throw when command is successfully logged', async () => {
        mockAuditRepository.create.mockReturnValue({});
        mockAuditRepository.save.mockResolvedValue({});

        await expect(
            service.logCommand(testProjectId, testUserId, testCommand),
        ).resolves.not.toThrow();
    });
});
});
