import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LessThan } from 'typeorm';
import { RenewalAlertService } from './renewal-alert.service';
import { ProjectEntity } from '../entities/project.entity';

describe('RenewalAlertService', () => {
    let service: RenewalAlertService;
    let mockProjectRepository: any;
    let mockLogger: any;

    beforeEach(async () => {
        mockProjectRepository = {
            find: jest.fn(),
        };

        mockLogger = {
            warn: jest.fn(),
               error: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RenewalAlertService,
                { provide: getRepositoryToken(ProjectEntity), useValue: mockProjectRepository },
            ],
        }).compile();

        service = module.get<RenewalAlertService>(RenewalAlertService);

        // Servisin private logger'ını, test edilebilir bir mock ile değiştiriyoruz
        (service as any).logger = mockLogger;
    });

    describe('checkExpiringCertificates', () => {
        it('should query projects with sslStatus active and sslExpiresAt in the future', async () => {
            mockProjectRepository.find.mockResolvedValue([]);

            await service.checkExpiringCertificates();

            expect(mockProjectRepository.find).toHaveBeenCalledWith({
                where: {
                    sslStatus: 'active',
                    sslExpiresAt: expect.anything(),
                },
            });
        });

        it('should log a warning for each project expiring within 7 days', async () => {
            const soonToExpire = {
                id: 'project-uuid-1',
                domain: 'project-uuid-1.depli.dev',
                sslExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 gün sonra
            };

            mockProjectRepository.find.mockResolvedValue([soonToExpire]);

            await service.checkExpiringCertificates();

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('project-uuid-1.depli.dev'),
            );
        });



        it('should log multiple warnings when multiple projects are expiring soon', async () => {
            const project1 = {
                id: 'project-uuid-1',
                domain: 'project-uuid-1.depli.dev',
                sslExpiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            };
            const project2 = {
                id: 'project-uuid-2',
                domain: 'project-uuid-2.depli.dev',
                sslExpiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            };

            mockProjectRepository.find.mockResolvedValue([project1, project2]);

            await service.checkExpiringCertificates();

            expect(mockLogger.warn).toHaveBeenCalledTimes(2);
        });

        it('should not throw when no projects are found', async () => {
            mockProjectRepository.find.mockResolvedValue([]);

            await expect(service.checkExpiringCertificates()).resolves.not.toThrow();
        });
    });
});
