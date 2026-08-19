"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const github_integration_service_1 = require("./github-integration.service");
const common_1 = require("@nestjs/common");
const tech_stack_service_1 = require("./tech-stack.service");
const encryption_service_1 = require("./encryption.service");
const docker_template_service_1 = require("./docker-template.service");
const project_entity_1 = require("../entities/project.entity");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const project_status_enum_1 = require("../enums/project-status.enum");
let ProjectService = class ProjectService {
    projectRepository;
    githubService;
    techStackService;
    dockerTemplateService;
    encryptionService;
    constructor(projectRepository, githubService, techStackService, dockerTemplateService, encryptionService) {
        this.projectRepository = projectRepository;
        this.githubService = githubService;
        this.techStackService = techStackService;
        this.dockerTemplateService = dockerTemplateService;
        this.encryptionService = encryptionService;
    }
    async createProject(projectData, userId) {
        if (!this.githubService.isValidGithubUrl(projectData.githubUrl)) {
            throw new common_1.BadRequestException("Invalid github url...");
        }
        if (!this.techStackService.isValidTechStack(projectData.techStack)) {
            throw new common_1.BadRequestException("Invalid tech combination...");
        }
        if (!this.githubService.isRepoAccessible(projectData.githubUrl)) {
            projectData.githubToken ? projectData.githubToken = this.encryptionService.encrypt(projectData.githubToken) : "";
        }
        let DC;
        if (!projectData.presetName) {
            DC = this.dockerTemplateService.generateDockerComposeYml(projectData.techStack);
        }
        else {
            DC = this.dockerTemplateService.generateDockerComposeYmlFromPreset(projectData.presetName);
        }
        const savedData = this.projectRepository.create({
            name: projectData.name,
            githubUrl: projectData.githubUrl,
            userId: userId,
            status: project_status_enum_1.ProjectStatus.PROVISIONING,
            techStack: projectData.techStack,
            dockerConfig: DC,
            githubToken: projectData.githubToken,
        });
        return (await this.projectRepository.save(savedData));
    }
    async getProject(projectId, userId) {
        const result = await this.projectRepository.findOne({
            where: { id: projectId }
        });
        if (!result) {
            throw new common_1.NotFoundException("Project Not Found...");
        }
        if (result.userId !== userId) {
            throw new common_1.ForbiddenException("Different Users...");
        }
        return result;
    }
    async getUserProjects(userId) {
        const result = await this.projectRepository.find({
            where: { userId: userId }
        });
        return result;
    }
    async deleteProject(projectId, userId) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId }
        });
        if (!project) {
            throw new common_1.NotFoundException("Project Not Found to Delete...");
        }
        if (project.userId !== userId) {
            throw new common_1.ForbiddenException("Different users...");
        }
        return this.projectRepository.remove(project);
    }
};
exports.ProjectService = ProjectService;
exports.ProjectService = ProjectService = __decorate([
    __param(0, (0, typeorm_2.InjectRepository)(project_entity_1.ProjectEntity)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        github_integration_service_1.GithubIntegrationService,
        tech_stack_service_1.TechStackService,
        docker_template_service_1.DockerTemplateService,
        encryption_service_1.EncryptionService])
], ProjectService);
//# sourceMappingURL=project.service.js.map