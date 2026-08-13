import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../entities/project.entity';
import { GithubIntegrationService } from '..//services/github-integration.service';
import { TechStackService } from '..//services/tech-stack.service';
import { DockerTemplateService } from '..//services/docker-template.service';
import { EncryptionService } from '..//services/encryption.service';
import { ProjectStatus } from '../enums/project-status.enum';
import { CreateProjectDto } from '../dto/create-project.dto';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';


describe('ProjectService', () => {

    let service: ProjectService;

    let mockProjectRepository: Partial<Repository<ProjectEntity>>;
    let mockGithubService: Partial<GithubIntegrationService>;
    let mockTechStackService: Partial<TechStackService>;
    let mockDockerTemplateService: Partial<DockerTemplateService>;
    let mockEncryptionService: Partial<EncryptionService>;

    beforeEach(async () => {
        // mock repository
        mockProjectRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            remove: jest.fn(),
            create: jest.fn().mockImplementation((entity) => entity),
        };

        mockGithubService = {
            isValidGithubUrl: jest.fn(),
            isRepoAccessible: jest.fn()
        };

        mockTechStackService = {
            isValidTechStack: jest.fn().mockReturnValue(true),
        };

        mockDockerTemplateService = {
            generateDockerComposeYml: jest.fn().mockReturnValue('yaml-content'),
        };

        mockEncryptionService = {
            encrypt: jest.fn().mockReturnValue('encrypted-token'),
        };

        // Create a testing module project service ı taklit eden sahte modül
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectService,
                { provide: getRepositoryToken(ProjectEntity), useValue: mockProjectRepository },
                
                { provide: GithubIntegrationService, useValue: mockGithubService },
                { provide: TechStackService, useValue: mockTechStackService },
                { provide: DockerTemplateService, useValue: mockDockerTemplateService },
                { provide: EncryptionService, useValue: mockEncryptionService },
            ]
        }).compile();

        service = module.get<ProjectService>(ProjectService);
    });

    describe("createProject", () => {

        
        // Proje oluşuyor mu testi
        it("create a project successfully", async () => {

            // Project service create metodu çağrıldığında sahte bir proje nesnesi döndürülmesini sağlamak için mockResolvedValue kullanılır.
            (mockProjectRepository.save as jest.Mock).mockResolvedValue({
                id: 'project-uuid',
                name: 'Test Project',
                userId: 'user-uuid',
                status: ProjectStatus.PROVISIONING,
            });
            (mockGithubService.isValidGithubUrl as jest.Mock).mockReturnValue(true);
            (mockTechStackService.isValidTechStack as jest.Mock).mockReturnValue(true);

            const dto: CreateProjectDto = {
                name: 'Test Project',
                githubUrl: 'https://github.com/react/react',
                techStack: {
                backend: 'nodejs',
                backendVersion: '20.5.0',
                frontend: 'react',
                frontendVersion: '18.2.0',
                database: 'postgresql',
                databaseVersion: '16',
                },
            };

            const result = await service.createProject(dto, "user-uuid");

            expect(mockGithubService.isValidGithubUrl).toHaveBeenCalledWith(dto.githubUrl);
            expect(mockTechStackService.isValidTechStack).toHaveBeenCalledWith(dto.techStack);
            expect(mockDockerTemplateService.generateDockerComposeYml).toHaveBeenCalledWith(dto.techStack);
            expect(mockProjectRepository.save).toHaveBeenCalled();

            expect(result.id).toBe('project-uuid');
            expect(result.status).toBe(ProjectStatus.PROVISIONING);

        });

        // Yanlış github url için test
        it("should throw an error for invalid GitHub URL", async () => {

            (mockGithubService.isValidGithubUrl as jest.Mock).mockReturnValue(false);

            const dto: CreateProjectDto = {
                name: 'Test Project',
                githubUrl: 'https://github.com/user/react', 
                techStack: { 
                    backend: 'nodejs',
                    backendVersion: '20.5.0',
                    frontend: 'react',
                    frontendVersion: '18.2.0',
                    database: 'postgresql',
                    databaseVersion: '16',
                },
            };

            await expect(service.createProject(dto, 'user-uuid')).rejects.toThrow(BadRequestException);

            expect(mockProjectRepository.save).not.toHaveBeenCalled();
            
        });

        // Yanlış tech stack için test
        it("should throw an error for invalid tech stack", async () => {

            // mock ile techstack uygun olup olmadığı kontrol edilirken mevcut durumun test amacına uygun olması için 
            // techstack onaylanmayacak şekilde isValidTechStack metodu false döndürülüyor.
            (mockTechStackService.isValidTechStack as jest.Mock).mockReturnValue(false);

            // createProject metoduna geçirmek için dto objesi
            const dto: CreateProjectDto = {
                name: 'Test Project',
                githubUrl: 'https://gitlab.com/user/repo', 
                techStack: { 
                    backend: 'nodejs',
                    backendVersion: '20.5.0',
                    frontend: 'react',
                    frontendVersion: '18.2.0',
                    database: 'postgresql',
                    databaseVersion: '16',
                },
            };

            // proje oluşturulurken isValidTechStackhata döndüreceğinden proje oluşturulamadan hata dönmeli. 
            await expect(service.createProject(dto, "user-uuid")).rejects.toThrow(BadRequestException);

            // Proje veritabanına hiç kaydedilemeyeceği için db save işlemi hiç çalışmamış olmalı.
            expect(mockProjectRepository.save).not.toHaveBeenCalled();

        });

        // Token encryption için test
        it("should token have been encrypted for private repo accessing", async () => {
            // Veri tabanına kayıt yapılırken token ın şifreli olması gerek.
            (mockProjectRepository.save as jest.Mock).mockResolvedValue({
                id: "project-uuid",
                name: "private-project-name"
            });
            (mockGithubService.isValidGithubUrl as jest.Mock).mockReturnValue(true);
            (mockTechStackService.isValidTechStack as jest.Mock).mockReturnValue(true);

            // Token içerecek şekilde db kaydedilecek veri oluşturuluyor.
            const dto: CreateProjectDto = {
                name: 'Private Project',
                githubUrl: 'https://github.com/user/private-repo',
                techStack: { 
                    backend: 'nodejs',
                    backendVersion: '20.5.0',
                    frontend: 'react',
                    frontendVersion: '18.2.0',
                    database: 'postgresql',
                    databaseVersion: '16',
                },
                githubToken: 'my-secret-token', // !
            };
        
            // proje db ye kaydediliyor.
            await service.createProject(dto, 'user-uuid');

            // encrypt metodu şifreleme parametresi ile çağrılmış olmalı.
            expect(mockEncryptionService.encrypt).toHaveBeenCalledWith("my-secret-token");

            // db save metodunun db ye kaydettiği veriyi yakalıyoruz. mock.calls yapılan tüm çağrıların tutulduğu dizi
            // dizinin içinden ilgili kayıt alınıyor.
            const savedData = (mockProjectRepository.save as jest.Mock).mock.calls[0][0];
            // github token ın şifrelenmiş olması gerekiyor.
            expect(savedData.githubToken).toBe('encrypted-token');
        });

        // Docker config dosyası için test
        it('should generate and save docker config when creating a project', async () => {
            (mockProjectRepository.save as jest.Mock).mockResolvedValue({
                id: 'project-uuid',
                name: 'Test Project',
            });
            (mockGithubService.isValidGithubUrl as jest.Mock).mockReturnValue(true);
            (mockTechStackService.isValidTechStack as jest.Mock).mockReturnValue(true);

            const dto: CreateProjectDto = {
                name: 'Private Project',
                githubUrl: 'https://github.com/user/private-repo',
                techStack: { 
                    backend: 'nodejs',
                    backendVersion: '20.5.0',
                    frontend: 'react',
                    frontendVersion: '18.2.0',
                    database: 'postgresql',
                    databaseVersion: '16',
                },
                githubToken: 'my-secret-token', // !
            };

            await service.createProject(dto, 'user-uuid');

            // 1. DockerTemplateService çağrıldı mı?
            expect(mockDockerTemplateService.generateDockerComposeYml)
                .toHaveBeenCalledWith(dto.techStack);

            // 2. Üretilen config save'e gönderildi mi?
            const savedData = (mockProjectRepository.save as jest.Mock).mock.calls[0][0];
            expect(savedData.dockerConfig).toBe('yaml-content'); 
        });
    });

    describe("getProject", () => {
        // Kullanıcın belirli bir projesinin döndürülmesi lazım.
        it("should return a project with a given spesific id", async () => {
            // isteği cevaplayacak sahte veri oluşturuluyor
            (mockProjectRepository.findOne as jest.Mock).mockResolvedValue({
                id: 'project-uuid',
                name: 'Test Project',
                userId: 'user-uuid', 
            });

            // user-uuid kullanıcısının project-uuid projesini istiyoruz. 
            // sahte veri ile aynı bilgiler parametre girildi ki başarılı durum simüle edilsin
            const result = await service.getProject('project-uuid', 'user-uuid');

            // findOne metodu project-uuid ile çağrılmış olmalı.
            expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'project-uuid' }
            });
            // sonuçta projenin id si doğru olmalı
            expect(result.id).toBe('project-uuid');
        });

        it('should throw ForbiddenException when user is not the owner', async () => {
            // Başka bir kullanıcının projesinin istendiği durum için uygun sahte veri.
            (mockProjectRepository.findOne as jest.Mock).mockResolvedValue({
                id: 'project-uuid',
                userId: 'other-user-uuid', 
            });

            await expect(service.getProject('project-uuid', 'my-user-uuid'))
                .rejects.toThrow(ForbiddenException);
        });

        it('should throw NotFoundException when project does not exist', async () => {
            // DB de olmayan bir verinin istendiği durum için sahte veri.
            (mockProjectRepository.findOne as jest.Mock).mockResolvedValue(null); 

            await expect(service.getProject('nonexistent-uuid', 'user-uuid'))
                .rejects.toThrow(NotFoundException);
        }); 
    });

    describe("getAllProjects", () =>  {
        it('should return all projects belonging to the user', async () => {
            //Bir kullanıcın tüm projelerini döndürmek için sahte veri.
            (mockProjectRepository.find as jest.Mock).mockResolvedValue([
                { id: 'project-1', userId: 'user-uuid' },
                { id: 'project-2', userId: 'user-uuid' },
            ]);

            // user-uuid kullanıcısının tüm projeleri result a atanıyor
            const result = await service.getUserProjects('user-uuid');

            // doğru kullanıcının projeleri listelendi mi
            expect(mockProjectRepository.find).toHaveBeenCalledWith({
                where: { userId: 'user-uuid' }
            });
            // tüm veriler eksik/fazla olmadan geldi mi
            expect(result).toHaveLength(2);
        });
    });

    describe("deleteProject", () => {
        it('should delete project when user is the owner', async () => {
            // silinecek proje için şablon oluşturuluyor.
            const project = { id: 'project-uuid', userId: 'user-uuid' };

            // Projeyi silmek için findone ve remove metodları çağrıldığında şablon proje döndürülecek.
            (mockProjectRepository.findOne as jest.Mock).mockResolvedValue(project);
            (mockProjectRepository.remove as jest.Mock).mockResolvedValue(project);

            // Projeyi sil.
            await service.deleteProject('project-uuid', 'user-uuid');

            // Remove metodu doğru proje için çağrılmış olmalı
            expect(mockProjectRepository.remove).toHaveBeenCalledWith(project);
        });

        it('should throw ForbiddenException when deleting another users project', async () => {
            // Proje bulunurken başka bir kullanıcının projesi döndürülüyor.
            (mockProjectRepository.findOne as jest.Mock).mockResolvedValue({
                id: 'project-uuid',
                userId: 'other-user-uuid',
            });

            // user id leri eşleşmediğinde hata dönmeli.
            await expect(service.deleteProject('project-uuid', 'my-user-uuid'))
                .rejects.toThrow(ForbiddenException);

            // silme işlemi hiç gerçekleşmemeli
            expect(mockProjectRepository.remove).not.toHaveBeenCalled();
        });
    });
});