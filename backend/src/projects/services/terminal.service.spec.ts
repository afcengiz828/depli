import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TerminalService } from './terminal.service';
import { ComposeFileService } from './compose-file.service';
import { DockerCliService } from './docker-cli.service';
import { ProjectEntity } from '../entities/project.entity';

describe('TerminalService', () => {
    let service: TerminalService;
    let mockProjectRepository: any;
    let mockComposeFileService: any;
    let mockDockerCliService: any;

    const testUserId = 'user-uuid-123';
    const testProjectId = 'project-uuid-456';
    const testComposeFilePath = '/tmp/depli-workspace/project-uuid-456/docker-compose.yml';
    const testServiceName = 'backend';

const validProject = {
    id: testProjectId,
    userId: testUserId,
    name: 'Test Project',
};

beforeEach(async () => {
    mockProjectRepository = {
        findOne: jest.fn(),
    };

    mockComposeFileService = {
        getComposeFilePath: jest.fn().mockReturnValue(testComposeFilePath),
    };

    mockDockerCliService = {
        execInteractive: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            TerminalService,
            { provide: getRepositoryToken(ProjectEntity), useValue: mockProjectRepository },
                                                                 { provide: ComposeFileService, useValue: mockComposeFileService },
                                                                 { provide: DockerCliService, useValue: mockDockerCliService },
        ],
    }).compile();

    service = module.get<TerminalService>(TerminalService);
});

describe('startTerminal', () => {
    it('should start terminal session for a project the user owns', async () => {
        mockProjectRepository.findOne.mockResolvedValue({ ...validProject });
        const mockWriteFn = jest.fn();
        const mockStopFn = jest.fn();
        mockDockerCliService.execInteractive.mockReturnValue({ write: mockWriteFn, stop: mockStopFn });

        const onData = jest.fn();
        const result = await service.startTerminal(testProjectId, testUserId, testServiceName, onData);

        expect(result.write).toBe(mockWriteFn);
        expect(result.stop).toBe(mockStopFn);
    });

    it('should pass the correct service name to dockerCliService.execInteractive', async () => {
        mockProjectRepository.findOne.mockResolvedValue({ ...validProject });
        mockDockerCliService.execInteractive.mockReturnValue({ write: jest.fn(), stop: jest.fn() });

        const onData = jest.fn();
        await service.startTerminal(testProjectId, testUserId, testServiceName, onData);

        expect(mockDockerCliService.execInteractive).toHaveBeenCalledWith(
            testComposeFilePath,
            testServiceName,
            onData,
        );
    });

    it('should throw NotFoundException when project does not exist', async () => {
        mockProjectRepository.findOne.mockResolvedValue(null);

        await expect(
            service.startTerminal(testProjectId, testUserId, testServiceName, jest.fn()),
        ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the project', async () => {
        mockProjectRepository.findOne.mockResolvedValue({
            ...validProject,
            userId: 'different-user-uuid',
        });

        await expect(
            service.startTerminal(testProjectId, testUserId, testServiceName, jest.fn()),
        ).rejects.toThrow(ForbiddenException);
    });

    it('should not call dockerCliService.execInteractive when ownership check fails', async () => {
        mockProjectRepository.findOne.mockResolvedValue({
            ...validProject,
            userId: 'different-user-uuid',
        });

        await expect(
            service.startTerminal(testProjectId, testUserId, testServiceName, jest.fn()),
        ).rejects.toThrow(ForbiddenException);

        expect(mockDockerCliService.execInteractive).not.toHaveBeenCalled();
    });
});
});
