import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { DomainAssignmentService } from './domain-assignment.service';
import { ProjectEntity } from '../entities/project.entity';

describe('DomainAssignmentService', () => {
    let service: DomainAssignmentService;
    let mockProjectRepository: any;
    let mockDnsProviderClient: any;

    const testUserId = 'user-uuid-123';
    const testProjectId = 'project-uuid-456';

const validProject = {
    id: testProjectId,
    userId: testUserId,
    name: 'Test Project',
    domain: null,
};

beforeEach(async () => {
    mockProjectRepository = {
        findOne: jest.fn(),
           save: jest.fn(),
    };

    mockDnsProviderClient = {
        createRecord: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            DomainAssignmentService,
            { provide: getRepositoryToken(ProjectEntity), useValue: mockProjectRepository },
                                                                 { provide: 'DNS_PROVIDER_CLIENT', useValue: mockDnsProviderClient },
        ],
    }).compile();

    service = module.get<DomainAssignmentService>(DomainAssignmentService);
});

describe('assignDomain', () => {
    it('should assign a domain to a project without an existing domain', async () => {
        mockProjectRepository.findOne.mockResolvedValue({ ...validProject });
        mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
        mockDnsProviderClient.createRecord.mockResolvedValue(undefined);

        const result = await service.assignDomain(testProjectId, testUserId);

        expect(result.domain).toMatch(/^[a-z0-9-]+\.depli\.dev$/);
    });

    it('should include the projectId in the generated subdomain', async () => {
        mockProjectRepository.findOne.mockResolvedValue({ ...validProject });
        mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
        mockDnsProviderClient.createRecord.mockResolvedValue(undefined);

        const result = await service.assignDomain(testProjectId, testUserId);

        expect(result.domain).toContain(testProjectId);
    });

    it('should call dnsProviderClient.createRecord with the generated domain', async () => {
        mockProjectRepository.findOne.mockResolvedValue({ ...validProject });
        mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
        mockDnsProviderClient.createRecord.mockResolvedValue(undefined);

        const result = await service.assignDomain(testProjectId, testUserId);

        expect(mockDnsProviderClient.createRecord).toHaveBeenCalledWith(
            result.domain,
            expect.any(String),
        );
    });

    it('should throw NotFoundException when project does not exist', async () => {
        mockProjectRepository.findOne.mockResolvedValue(null);

        await expect(
            service.assignDomain(testProjectId, testUserId),
        ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user does not own the project', async () => {
        mockProjectRepository.findOne.mockResolvedValue({
            ...validProject,
            userId: 'different-user-uuid',
        });

        await expect(
            service.assignDomain(testProjectId, testUserId),
        ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when project already has a domain', async () => {
        mockProjectRepository.findOne.mockResolvedValue({
            ...validProject,
            domain: 'already-assigned.depli.dev',
        });

        await expect(
            service.assignDomain(testProjectId, testUserId),
        ).rejects.toThrow(ConflictException);
    });

    it('should not call dnsProviderClient.createRecord when domain already exists', async () => {
        mockProjectRepository.findOne.mockResolvedValue({
            ...validProject,
            domain: 'already-assigned.depli.dev',
        });

        await expect(
            service.assignDomain(testProjectId, testUserId),
        ).rejects.toThrow(ConflictException);

        expect(mockDnsProviderClient.createRecord).not.toHaveBeenCalled();
    });
});
});
