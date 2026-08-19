import { CreateProjectDto } from "../dto/create-project.dto";
import { GithubIntegrationService } from "./github-integration.service";
import { TechStackService } from "./tech-stack.service";
import { EncryptionService } from "./encryption.service";
import { DockerTemplateService } from "./docker-template.service";
import { ProjectEntity } from "../entities/project.entity";
import { Repository } from 'typeorm';
export declare class ProjectService {
    private readonly projectRepository;
    private readonly githubService;
    private readonly techStackService;
    private readonly dockerTemplateService;
    private readonly encryptionService;
    constructor(projectRepository: Repository<ProjectEntity>, githubService: GithubIntegrationService, techStackService: TechStackService, dockerTemplateService: DockerTemplateService, encryptionService: EncryptionService);
    createProject(projectData: CreateProjectDto, userId: string): Promise<ProjectEntity>;
    getProject(projectId: string, userId: string): Promise<ProjectEntity>;
    getUserProjects(userId: string): Promise<ProjectEntity[]>;
    deleteProject(projectId: string, userId: string): Promise<ProjectEntity>;
}
