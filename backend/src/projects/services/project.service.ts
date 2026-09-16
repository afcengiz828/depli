import { UUID } from "crypto";
import { CreateProjectDto } from "../dto/create-project.dto";
import { GithubIntegrationService } from "./github-integration.service";
import { BadRequestException, ForbiddenException, NotFoundException, UseFilters } from "@nestjs/common";
import { TechStackService } from "./tech-stack.service";
import { EncryptionService } from "./encryption.service"
import { DockerTemplateService } from "./docker-template.service"
import { ComposeFileService } from "./compose-file.service"
import { DockerCliService } from "./docker-cli.service"
import { ProjectEntity } from "../entities/project.entity"
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ProjectStatus } from "../enums/project-status.enum";

export class ProjectService {

    constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    private readonly githubService: GithubIntegrationService,
    private readonly techStackService: TechStackService,
    private readonly dockerTemplateService: DockerTemplateService,
    private readonly encryptionService: EncryptionService,
    private readonly composeFileService: ComposeFileService,
    private readonly dockerCliService: DockerCliService,
  ) {}

    async createProject(projectData: CreateProjectDto, userId: string): Promise<ProjectEntity> {
        // Logic to create a new project


        // KONTROLLER...

        // Github Url kontrolü
        if(!this.githubService.isValidGithubUrl(projectData.githubUrl)){
            throw new BadRequestException("Invalid github url...");
        }

        // TechStack kontrolleri
        if(!this.techStackService.isValidTechStack(projectData.techStack)){
            throw new BadRequestException("Invalid tech combination...");
        }

        // GithubToken kontrolü
        if(!this.githubService.isRepoAccessible(projectData.githubUrl)){
            projectData.githubToken ? projectData.githubToken = this.encryptionService.encrypt(projectData.githubToken) : "" ;
        }



        const savedData = this.projectRepository.create({
            name: projectData.name,
            githubUrl: projectData.githubUrl,
            userId: userId,
            status: ProjectStatus.PROVISIONING,
            techStack: projectData.techStack,
            githubToken: projectData.githubToken,
        })
        
        return (await this.projectRepository.save(savedData));
         
    }

    async getProject(projectId: string, userId: string): Promise<ProjectEntity> {
        const result = await this.projectRepository.findOne({
            where: { id: projectId }  // ← userId kaldırıldı
        });

        if (!result) {
            throw new NotFoundException("Project Not Found...");
        }

        if (result.userId !== userId) {
            throw new ForbiddenException("Different Users...");
        }

        return result;
    }

    async getUserProjects(userId: string): Promise<ProjectEntity[]> {
        const result = await this.projectRepository.find({
            where: {userId : userId}
        })

        return result;
    }

    async deleteProject(projectId: string, userId: string) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId }  // ← userId kaldırıldı
        });

        if (!project) {
            throw new NotFoundException("Project Not Found to Delete...");
        }

        if (project.userId !== userId) {
            throw new ForbiddenException("Different users...");
        }

        // Proje silinmeden önce, arkada hâlâ çalışan bir konteynır varsa
        // önce onu durdurup diskteki compose dosyalarını temizliyoruz.
        // Compose dosyası hiç oluşmamışsa (proje hiç başlatılmadıysa) bu adımlar
        // sessizce başarısız olur/no-op olur, silme işlemini engellemez.
        try {
            const filePath = this.composeFileService.getComposeFilePath(projectId);
            await this.dockerCliService.down(filePath);
            await this.composeFileService.deleteProjectDir(projectId);
        } catch (error) {
            // Temizlik başarısız olsa bile proje kaydının silinmesine devam edilir
        }

        return this.projectRepository.remove(project);
    }

}
