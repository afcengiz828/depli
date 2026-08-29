import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EnvVariableService } from './env-variable.service';
import { EncryptionService } from './encryption.service';
import { ProjectEntity } from '../entities/project.entity';

describe('EnvVariableService', () => {
    let service: EnvVariableService;
    let mockProjectRepository: any;
    let mockEncryptionService: any;

    const testUserId = 'user-uuid-123';
    const testProjectId = 'project-uuid-456';

    const validProject = {
        id: testProjectId,
        userId: testUserId,
        name: 'Test Project',
        envVariables: null,
    };

    beforeEach(async () => {
        mockProjectRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        mockEncryptionService = {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EnvVariableService,
                { provide: getRepositoryToken(ProjectEntity), useValue: mockProjectRepository },
                { provide: EncryptionService, useValue: mockEncryptionService },
            ],
        }).compile();

        service = module.get<EnvVariableService>(EnvVariableService);
    });

    // Test bloklarını buraya ekleyeceksin

    describe("setEnvVariables", () => {
        it("should encrpyt all values before saving", async () => {
            mockProjectRepository.findOne.mockResolvedValue({... validProject});
            mockEncryptionService.encrypt.mockImplementation((value: string) => `encrypted-${value}`);
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));

            await service.setEnvVariables(testProjectId, testUserId, {DB_PASSWORD: "secret123"});
            const savedProject = mockProjectRepository.save.mock.calls[0][0];

            expect(mockEncryptionService.encrypt).toHaveBeenCalledWith("secret123");
            expect(savedProject.envVariables.DB_PASSWORD).toBe("encrypted-secret123");

        });

        it("should throw BadRequestException for invalid key format", async () => {
            mockProjectRepository.findOne.mockResolvedValue({... validProject});
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));

            await expect( service.setEnvVariables(testProjectId, testUserId, {'invalid key': "value"})).rejects.toThrow(BadRequestException);

        });

        it("should throw NotFoundException when project does not exist", async () => {
            mockProjectRepository.findOne.mockResolvedValue(null);
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));

            await expect( service.setEnvVariables(testProjectId, testUserId, {DB_PASSWORD: "secret123"})).rejects.toThrow(NotFoundException);

        });

        it("should throw ForbiddenException when user is not the owner", async () => {
            mockProjectRepository.findOne.mockResolvedValue({
                id: testProjectId,
                userId: "testUserId",
                name: 'Test Project',
                envVariables: null,
            });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));

            await expect( service.setEnvVariables(testProjectId, testUserId, {DB_PASSWORD: "secret123"})).rejects.toThrow(ForbiddenException);

        });

        it("should overwrite existing env variables entirely", async () => {
            mockEncryptionService.encrypt.mockImplementation((value: string) => `encrypted-${value}`);
            mockProjectRepository.findOne.mockResolvedValue({
                ...validProject,
                envVariables: { OLD_KEY: 'old-encrypted' },
            });
            mockProjectRepository.save.mockImplementation((p: any) => Promise.resolve({ ...p }));

            await service.setEnvVariables(testProjectId, testUserId, { NEW_KEY: 'new-value' });
            const savedProject = mockProjectRepository.save.mock.calls[0][0];

            expect(savedProject.envVariables.OLD_KEY).toBeUndefined();
            expect(savedProject.envVariables).toEqual({ NEW_KEY: 'encrypted-new-value' });
        });
    });

    describe("getEnvVariableKeys", () => {
        it("should return only keys, not values", async () => {

            mockProjectRepository.findOne.mockResolvedValue({
                id: testProjectId,
                userId: testUserId,
                name: 'Test Project',
                envVariables: { DB_PASSWORD: 'encrypted-xyz', API_KEY: 'encrypted-abc' },
            });

            const result = await service.getEnvVariableKeys(testProjectId, testUserId);

            expect(result).toEqual(['DB_PASSWORD', 'API_KEY']);
        });

        it("should return empty array when no env variables are set", async () => {

            mockProjectRepository.findOne.mockResolvedValue({
                id: testProjectId,
                userId: testUserId,
                name: 'Test Project',
                envVariables: null,
            });

            const result = await service.getEnvVariableKeys(testProjectId, testUserId);

            expect(result).toEqual([]);
        })

        it("should throw ForbiddenException when user is not the owner", async () => {

            mockProjectRepository.findOne.mockResolvedValue({
                id: testProjectId,
                userId: "testUserId",
                name: 'Test Project',
                envVariables: { DB_PASSWORD: 'encrypted-xyz', API_KEY: 'encrypted-abc' },
            });



            await expect( service.getEnvVariableKeys(testProjectId, testUserId)).rejects.toThrow(ForbiddenException);
        });
    })
});
