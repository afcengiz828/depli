import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ContainerLifecycleService } from './container-lifecycle.service';
import { ComposeFileService } from './compose-file.service';
import { DockerCliService } from './docker-cli.service';
import { ProjectEntity } from '../entities/project.entity';
import { ProjectStatus } from '../enums/project-status.enum';
import { HealthcheckService } from './healthcheck.service';
import { DomainAssignmentService } from './domain-assignment.service';
import { SslCertificateService } from './ssl-certificate.service';

describe('ContainerLifecycleService', () => {
    let service: ContainerLifecycleService;
    let mockProjectRepository: any;
    let mockComposeFileService: any;
    let mockDockerCliService: any;
    let mockHealthcheckService: any;
    let mockDomainAssignmentService: any;
    let mockSslCertificateService: any;

    const testUserId = 'user-uuid-123';
    const testProjectId = 'project-uuid-456';
    const testComposeFilePath = '/tmp/depli-workspace/project-uuid-456/docker-compose.yml';

    const validProject = {
        id: testProjectId,
        userId: testUserId,
        name: 'Test Project',
        status: ProjectStatus.STOPPED,
        dockerConfig: 'services:\n  backend:\n    image: node:20-alpine\n',
    };

    beforeEach(async () => {

        jest.clearAllMocks();

        mockProjectRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        mockComposeFileService = {
            writeComposeFile: jest.fn(),
            deleteProjectDir: jest.fn(),
            getComposeFilePath: jest.fn().mockReturnValue(testComposeFilePath),
        };

        mockDockerCliService = {
            up: jest.fn(),
            down: jest.fn(),
            stop: jest.fn(),
            start: jest.fn(),
        };

        mockHealthcheckService = {
            waitUntilHealthy: jest.fn(),
        };


        // beforeEach içinde:
        mockDomainAssignmentService = {
            assignDomain: jest.fn(),
        };

        mockSslCertificateService = {
            issueCertificate: jest.fn(),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContainerLifecycleService,
                { provide: getRepositoryToken(ProjectEntity), useValue: mockProjectRepository },
                { provide: ComposeFileService, useValue: mockComposeFileService },
                { provide: DockerCliService, useValue: mockDockerCliService },
                { provide: HealthcheckService, useValue: mockHealthcheckService },
                { provide: DomainAssignmentService, useValue: mockDomainAssignmentService },
                { provide: SslCertificateService, useValue: mockSslCertificateService },
            ],
        }).compile();

        service = module.get<ContainerLifecycleService>(ContainerLifecycleService);
    });

    describe('startContainer', () => {
        it('should start a container successfully and set status to running', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockComposeFileService.writeComposeFile.mockResolvedValue(testComposeFilePath);
            mockDockerCliService.up.mockResolvedValue({ success: true, output: 'containers started' });
            mockHealthcheckService.waitUntilHealthy.mockResolvedValue(true);
            mockDomainAssignmentService.assignDomain.mockResolvedValue({ domain: 'test.depli.dev' });
            mockSslCertificateService.issueCertificate.mockResolvedValue({ sslStatus: 'active' });
            const result = await service.startContainer(testProjectId, testUserId);
            expect(result.status).toBe(ProjectStatus.RUNNING);
        });

        it('should throw NotFoundException when project does not exist', async () => {
            mockProjectRepository.findOne.mockResolvedValue(null);
            await expect(service.startContainer(testProjectId, testUserId)).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not the owner', async () => {
            mockProjectRepository.findOne.mockResolvedValue({
                ...validProject,
                userId: 'differentTestUserId',
            });
            await expect(service.startContainer(testProjectId, testUserId)).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException when dockerConfig is missing', async () => {
            mockProjectRepository.findOne.mockResolvedValue({
                ...validProject,
                dockerConfig: null,
            });
            await expect(service.startContainer(testProjectId, testUserId)).rejects.toThrow(BadRequestException);
        });

        it('should set status to provisioning before attempting to start', async () => {
            const savedSnapshots: any[] = [];

            mockProjectRepository.findOne.mockResolvedValue({ ...validProject });
            mockProjectRepository.save.mockImplementation((p: any) => {
                savedSnapshots.push({ ...p });  // ← argümanın o anki kopyasını burada al
                return Promise.resolve({ ...p });
            });
            mockComposeFileService.writeComposeFile.mockResolvedValue(testComposeFilePath);
            mockDockerCliService.up.mockResolvedValue({ success: true, output: '' });
            mockHealthcheckService.waitUntilHealthy.mockResolvedValue(true);
            mockDomainAssignmentService.assignDomain.mockResolvedValue({ domain: 'test.depli.dev' });
            mockSslCertificateService.issueCertificate.mockResolvedValue({ sslStatus: 'active' });
            await service.startContainer(testProjectId, testUserId);

            expect(savedSnapshots[0].status).toBe(ProjectStatus.PROVISIONING);
        });

        it('should call composeFileService.writeComposeFile with correct arguments', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockComposeFileService.writeComposeFile.mockResolvedValue(testComposeFilePath);
            mockDockerCliService.up.mockResolvedValue({ success: true, output: '' });
            mockHealthcheckService.waitUntilHealthy.mockResolvedValue(true);
            mockDomainAssignmentService.assignDomain.mockResolvedValue({ domain: 'test.depli.dev' });
            mockSslCertificateService.issueCertificate.mockResolvedValue({ sslStatus: 'active' });
            await service.startContainer(testProjectId, testUserId);

            expect(mockComposeFileService.writeComposeFile).toHaveBeenCalledWith(
                testProjectId,
                validProject.dockerConfig,
            );
        });

        it('should call dockerCliService.up with the compose file path', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockComposeFileService.writeComposeFile.mockResolvedValue(testComposeFilePath);
            mockDockerCliService.up.mockResolvedValue({ success: true, output: '' });
            mockHealthcheckService.waitUntilHealthy.mockResolvedValue(true);
            mockDomainAssignmentService.assignDomain.mockResolvedValue({ domain: 'test.depli.dev' });
            mockSslCertificateService.issueCertificate.mockResolvedValue({ sslStatus: 'active' });
            await service.startContainer(testProjectId, testUserId);

            expect(mockDockerCliService.up).toHaveBeenCalledWith(testComposeFilePath);
        });

        it('should set status to stopped when docker up fails', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockComposeFileService.writeComposeFile.mockResolvedValue(testComposeFilePath);
            mockDockerCliService.up.mockResolvedValue({ success: false, output: 'port conflict' });

            await expect(service.startContainer(testProjectId, testUserId)).rejects.toThrow();

            const lastSaveCall = mockProjectRepository.save.mock.calls[
                mockProjectRepository.save.mock.calls.length - 1
            ][0];
            expect(lastSaveCall.status).toBe(ProjectStatus.STOPPED);
        });

        it('should set status to stopped when healthcheck fails', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockComposeFileService.writeComposeFile.mockResolvedValue(testComposeFilePath);
            mockDockerCliService.up.mockResolvedValue({ success: true, output: '' });
            mockHealthcheckService.waitUntilHealthy.mockResolvedValue(false);

            await expect(service.startContainer(testProjectId, testUserId)).rejects.toThrow();
        });

        it('should assign domain when project has no domain after successful start', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject, domain: null });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockComposeFileService.writeComposeFile.mockResolvedValue(testComposeFilePath);
            mockDockerCliService.up.mockResolvedValue({ success: true, output: '' });
            mockHealthcheckService.waitUntilHealthy.mockResolvedValue(true);
            mockDomainAssignmentService.assignDomain.mockResolvedValue({ domain: 'test.depli.dev' });
            mockSslCertificateService.issueCertificate.mockResolvedValue({ sslStatus: 'active' });

            await service.startContainer(testProjectId, testUserId);

            expect(mockDomainAssignmentService.assignDomain).toHaveBeenCalledWith(testProjectId, testUserId);
        });

        it('should not assign domain when project already has one', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject, domain: 'existing.depli.dev' });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockComposeFileService.writeComposeFile.mockResolvedValue(testComposeFilePath);
            mockDockerCliService.up.mockResolvedValue({ success: true, output: '' });
            mockHealthcheckService.waitUntilHealthy.mockResolvedValue(true);
            mockSslCertificateService.issueCertificate.mockResolvedValue({ sslStatus: 'active' });

            await service.startContainer(testProjectId, testUserId);

            expect(mockDomainAssignmentService.assignDomain).not.toHaveBeenCalled();
        });

        it('should issue SSL certificate when domain is assigned but SSL is missing', async () => {
            mockProjectRepository.findOne.mockResolvedValue({
                ...validProject,
                domain: 'existing.depli.dev',
                sslStatus: null,
            });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockComposeFileService.writeComposeFile.mockResolvedValue(testComposeFilePath);
            mockDockerCliService.up.mockResolvedValue({ success: true, output: '' });
            mockHealthcheckService.waitUntilHealthy.mockResolvedValue(true);
            mockSslCertificateService.issueCertificate.mockResolvedValue({ sslStatus: 'active' });

            await service.startContainer(testProjectId, testUserId);

            expect(mockSslCertificateService.issueCertificate).toHaveBeenCalledWith(testProjectId, testUserId);
        });

        it('should still set status to running even if domain assignment fails', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject, domain: null });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockComposeFileService.writeComposeFile.mockResolvedValue(testComposeFilePath);
            mockDockerCliService.up.mockResolvedValue({ success: true, output: '' });
            mockHealthcheckService.waitUntilHealthy.mockResolvedValue(true);
            mockDomainAssignmentService.assignDomain.mockRejectedValue(new Error('DNS provider unavailable'));
            mockSslCertificateService.issueCertificate.mockResolvedValue({ sslStatus: 'active' });

            const result = await service.startContainer(testProjectId, testUserId);

            expect(result.status).toBe(ProjectStatus.RUNNING);
        });

        it('should still set status to running even if SSL issuance fails', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject, domain: null });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockComposeFileService.writeComposeFile.mockResolvedValue(testComposeFilePath);
            mockDockerCliService.up.mockResolvedValue({ success: true, output: '' });
            mockHealthcheckService.waitUntilHealthy.mockResolvedValue(true);
            mockDomainAssignmentService.assignDomain.mockResolvedValue({ domain: 'test.depli.dev' });
            mockSslCertificateService.issueCertificate.mockRejectedValue(new Error('ACME challenge failed'));

            const result = await service.startContainer(testProjectId, testUserId);

            expect(result.status).toBe(ProjectStatus.RUNNING);
        });
    });

    describe('stopContainer', () => {
        it('should stop a container successfully and set status to stopped', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject, status: ProjectStatus.RUNNING });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockDockerCliService.stop.mockResolvedValue({ success: true, output: 'containers stopped' });

            const result = await service.stopContainer(testProjectId, testUserId);
            expect(result.status).toBe(ProjectStatus.STOPPED);
        });

        it('should throw NotFoundException when project does not exist', async () => {
            mockProjectRepository.findOne.mockResolvedValue(null);
            await expect(service.stopContainer(testProjectId, testUserId)).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not the owner', async () => {
            mockProjectRepository.findOne.mockResolvedValue({
                ...validProject,
                userId: 'differentTestUserId',
            });
            await expect(service.stopContainer(testProjectId, testUserId)).rejects.toThrow(ForbiddenException);
        });

        it('should call dockerCliService.stop with the compose file path', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject, status: ProjectStatus.RUNNING });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockDockerCliService.stop.mockResolvedValue({ success: true, output: '' });

            await service.stopContainer(testProjectId, testUserId);

            expect(mockDockerCliService.stop).toHaveBeenCalledWith(testComposeFilePath);
        });

        it('should throw an error when docker stop fails', async () => {
            mockProjectRepository.findOne.mockResolvedValue({
                ...validProject,
                status: ProjectStatus.RUNNING,
            });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockDockerCliService.stop.mockResolvedValue({ success: false, output: 'container not responding' });

            await expect(service.stopContainer(testProjectId, testUserId)).rejects.toThrow();
        });
    });

    describe('removeContainer', () => {
        it('should remove container and delete compose files', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject, status: ProjectStatus.RUNNING });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockDockerCliService.down.mockResolvedValue({ success: true, output: 'containers removed' });
            mockComposeFileService.deleteProjectDir.mockResolvedValue(undefined);

            await service.removeContainer(testProjectId, testUserId);

            expect(mockDockerCliService.down).toHaveBeenCalled();
            expect(mockComposeFileService.deleteProjectDir).toHaveBeenCalledWith(testProjectId);
        });

        it('should set status to stopped after removal', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject, status: ProjectStatus.RUNNING });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockDockerCliService.down.mockResolvedValue({ success: true, output: 'containers removed' });
            mockComposeFileService.deleteProjectDir.mockResolvedValue(undefined);

            const result = await service.removeContainer(testProjectId, testUserId);

            expect(result.status).toBe(ProjectStatus.STOPPED);
        });

        it('should throw NotFoundException when project does not exist', async () => {
            mockProjectRepository.findOne.mockResolvedValue(null);
            await expect(service.removeContainer(testProjectId, testUserId)).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user is not the owner', async () => {
            mockProjectRepository.findOne.mockResolvedValue({
                ...validProject,
                userId: 'differentTestUserId',
            });
            await expect(service.removeContainer(testProjectId, testUserId)).rejects.toThrow(ForbiddenException);
        });

        it('should call docker down before deleting compose files', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProject, status: ProjectStatus.RUNNING });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockDockerCliService.down.mockResolvedValue({ success: true, output: 'containers removed' });
            mockComposeFileService.deleteProjectDir.mockResolvedValue(undefined);

            await service.removeContainer(testProjectId, testUserId);

            const downCallOrder = mockDockerCliService.down.mock.invocationCallOrder[0];
            const deleteCallOrder = mockComposeFileService.deleteProjectDir.mock.invocationCallOrder[0];

            expect(downCallOrder).toBeLessThan(deleteCallOrder);
        });
    });
});
