import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { LogStreamService } from './log-stream.service';
import { ComposeFileService } from './compose-file.service';
import { DockerCliService } from './docker-cli.service';
import { ProjectEntity } from '../entities/project.entity';

describe('LogStreamService', () => {
    let service: LogStreamService;
    let mockProjectRepository: any;
    let mockComposeFileService: any;
    let mockDockerCliService: any;

    const testUserId = 'user-uuid-123';
    const testProjectId = 'project-uuid-456';
    const testComposeFilePath = '/tmp/depli-workspace/project-uuid-456/docker-compose.yml';

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
        streamLogs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            LogStreamService,
            { provide: getRepositoryToken(ProjectEntity), useValue: mockProjectRepository },
                                                                 { provide: ComposeFileService, useValue: mockComposeFileService },
                                                                 { provide: DockerCliService, useValue: mockDockerCliService },
        ],
    }).compile();

    service = module.get<LogStreamService>(LogStreamService);
});

describe('startStreaming', () => {
    it('should start streaming logs for a project the user owns', async () => {
        mockProjectRepository.findOne.mockResolvedValue({ ...validProject });
        const mockStopFn = jest.fn();
        mockDockerCliService.streamLogs.mockReturnValue({ stop: mockStopFn });

        const onData = jest.fn();
        const result = await service.startStreaming(testProjectId, testUserId, onData);

        expect(mockDockerCliService.streamLogs).toHaveBeenCalledWith(testComposeFilePath, onData);
        expect(result.stop).toBe(mockStopFn);
    });

    it('should throw NotFoundException when project does not exist', async () => {
        mockProjectRepository.findOne.mockResolvedValue(null);

        await expect(
            service.startStreaming(testProjectId, testUserId, jest.fn()),
        ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the project', async () => {
        mockProjectRepository.findOne.mockResolvedValue({
            ...validProject,
            userId: 'different-user-uuid',
        });

        await expect(
            service.startStreaming(testProjectId, testUserId, jest.fn()),
        ).rejects.toThrow(ForbiddenException);
    });

    it('should not call dockerCliService.streamLogs when ownership check fails', async () => {
        mockProjectRepository.findOne.mockResolvedValue({
            ...validProject,
            userId: 'different-user-uuid',
        });

        await expect(
            service.startStreaming(testProjectId, testUserId, jest.fn()),
        ).rejects.toThrow(ForbiddenException);

        expect(mockDockerCliService.streamLogs).not.toHaveBeenCalled();
    });
});
});
