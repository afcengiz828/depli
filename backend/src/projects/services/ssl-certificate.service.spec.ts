import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SslCertificateService } from './ssl-certificate.service';
import { ProjectEntity } from '../entities/project.entity';

describe('SslCertificateService', () => {
    let service: SslCertificateService;
    let mockProjectRepository: any;
    let mockAcmeClient: any;

    const testUserId = 'user-uuid-123';
    const testProjectId = 'project-uuid-456';
    const testDomain = `${testProjectId}.depli.dev`;

    const validProjectWithDomain = {
        id: testProjectId,
         userId: testUserId,
         name: 'Test Project',
         domain: testDomain,
         sslStatus: null,
         sslExpiresAt: null,
    };

    beforeEach(async () => {
        mockProjectRepository = {
            findOne: jest.fn(),
               save: jest.fn(),
        };

        mockAcmeClient = {
            requestCertificate: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SslCertificateService,
                { provide: getRepositoryToken(ProjectEntity), useValue: mockProjectRepository },
                                                                     { provide: 'ACME_CLIENT', useValue: mockAcmeClient },
            ],
        }).compile();

        service = module.get<SslCertificateService>(SslCertificateService);
    });

    describe('issueCertificate', () => {
        it('should issue a certificate for a project with an assigned domain', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProjectWithDomain });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockAcmeClient.requestCertificate.mockResolvedValue({ expiresAt: new Date('2027-01-01') });

            const result = await service.issueCertificate(testProjectId, testUserId);

            expect(result.sslStatus).toBe('active');
            expect(result.sslExpiresAt).toEqual(new Date('2027-01-01'));
        });

        it('should call acmeClient.requestCertificate with the project domain', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProjectWithDomain });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockAcmeClient.requestCertificate.mockResolvedValue({ expiresAt: new Date('2027-01-01') });

            await service.issueCertificate(testProjectId, testUserId);

            expect(mockAcmeClient.requestCertificate).toHaveBeenCalledWith(testDomain);
        });

        it('should throw NotFoundException when project does not exist', async () => {
            mockProjectRepository.findOne.mockResolvedValue(null);

            await expect(
                service.issueCertificate(testProjectId, testUserId),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException when user does not own the project', async () => {
            mockProjectRepository.findOne.mockResolvedValue({
                ...validProjectWithDomain,
                userId: 'different-user-uuid',
            });

            await expect(
                service.issueCertificate(testProjectId, testUserId),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw BadRequestException when project has no domain assigned', async () => {
            mockProjectRepository.findOne.mockResolvedValue({
                ...validProjectWithDomain,
                domain: null,
            });

            await expect(
                service.issueCertificate(testProjectId, testUserId),
            ).rejects.toThrow(BadRequestException);
        });

        it('should not call acmeClient.requestCertificate when domain is missing', async () => {
            mockProjectRepository.findOne.mockResolvedValue({
                ...validProjectWithDomain,
                domain: null,
            });

            await expect(
                service.issueCertificate(testProjectId, testUserId),
            ).rejects.toThrow(BadRequestException);

            expect(mockAcmeClient.requestCertificate).not.toHaveBeenCalled();
        });

        it('should set sslStatus to failed when certificate request fails', async () => {
            mockProjectRepository.findOne.mockResolvedValue({ ...validProjectWithDomain });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));
            mockAcmeClient.requestCertificate.mockRejectedValue(new Error('ACME challenge failed'));

            await expect(
                service.issueCertificate(testProjectId, testUserId),
            ).rejects.toThrow();

            const lastSaveCall = mockProjectRepository.save.mock.calls[
                mockProjectRepository.save.mock.calls.length - 1
            ][0];
            expect(lastSaveCall.sslStatus).toBe('failed');
        });
    });
});
