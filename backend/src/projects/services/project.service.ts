import { UUID } from "crypto";
import { CreateProjectDto } from "../dto/create-project.dto";
import { GithubIntegrationService } from "./github-integration.service";
import { BadRequestException, ForbiddenException, NotFoundException, UseFilters } from "@nestjs/common";
import { TechStackService } from "./tech-stack.service";
import { EncryptionService } from "./encryption.service"
import { DockerTemplateService } from "./docker-template.service"
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

        let DC: string;
        // DockerConfig üretimi
        if(!projectData.presetName){
            DC = this.dockerTemplateService.generateDockerComposeYml(projectData.techStack);
        }else {
            DC = this.dockerTemplateService.generateDockerComposeYmlFromPreset(projectData.presetName);
        }

        const savedData = this.projectRepository.create({
            name: projectData.name,
            githubUrl: projectData.githubUrl,
            userId: userId,
            status: ProjectStatus.PROVISIONING,
            techStack: projectData.techStack,
            dockerConfig: DC,
            githubToken: projectData.githubToken,
        })
        
        return (await this.projectRepository.save(savedData));
         
    }

    async getProject(projectId: string, userId: string): Promise<ProjectEntity> {
        // Logic to retrieve a project by its ID
        const result = await this.projectRepository.findOne({
            where: {id: projectId, userId: userId}
        });

        if(!result){
            throw new NotFoundException("Project Not Found with Given User...");
        }

        if(! (result?.userId == userId)){
            throw new ForbiddenException("Different Users...")
        }

        return result;

        
    }

    async getUserProjects(userId: string): Promise<ProjectEntity[]> {
        const result = await this.projectRepository.find({
            where: {userId : userId}
        })

        return result;
    }

    async deleteProject(projectId: any, userId: string){
        const project = await this.projectRepository.findOne({
            where: {id: projectId, userId: userId}
        });

        if(!project){
            throw new NotFoundException("Project Not Found to Delete...");
        }

        if(project.userId != userId){
            throw new ForbiddenException("Different users...")
        }

        return this.projectRepository.remove(project);
    }

}