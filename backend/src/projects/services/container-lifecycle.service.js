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
exports.ContainerLifecycleService = void 0;
const typeorm_1 = require("@nestjs/typeorm");
const project_entity_1 = require("../entities/project.entity");
const compose_file_service_1 = require("./compose-file.service");
const docker_cli_service_1 = require("./docker-cli.service");
const typeorm_2 = require("typeorm");
const common_1 = require("@nestjs/common");
const project_status_enum_1 = require("../enums/project-status.enum");
let ContainerLifecycleService = class ContainerLifecycleService {
    projectRepository;
    composeFileService;
    dockerCliService;
    constructor(projectRepository, composeFileService, dockerCliService) {
        this.projectRepository = projectRepository;
        this.composeFileService = composeFileService;
        this.dockerCliService = dockerCliService;
    }
    async findProjectOrThrow(projectId, userId) {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        if (project.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this project');
        }
        return project;
    }
    async startContainer(pId, uId) {
        const project = await this.findProjectOrThrow(pId, uId);
        if (!project.dockerConfig) {
            throw new common_1.BadRequestException("dockerConfig is missing, technology selection required");
        }
        project.status = project_status_enum_1.ProjectStatus.PROVISIONING;
        await this.projectRepository.save(project);
        const filePath = await this.composeFileService.writeComposeFile(project.id, project.dockerConfig);
        const result = await this.dockerCliService.up(filePath);
        if (result.success) {
            project.status = project_status_enum_1.ProjectStatus.RUNNING;
            return await this.projectRepository.save(project);
        }
        else {
            project.status = project_status_enum_1.ProjectStatus.STOPPED;
            await this.projectRepository.save(project);
            throw new common_1.InternalServerErrorException(result.output);
        }
    }
    async stopContainer(pId, uId) {
        const project = await this.findProjectOrThrow(pId, uId);
        const filePath = this.composeFileService.getComposeFilePath(project.id);
        const result = await this.dockerCliService.stop(filePath);
        if (result.success) {
            project.status = project_status_enum_1.ProjectStatus.STOPPED;
            return await this.projectRepository.save(project);
        }
        else {
            throw new common_1.InternalServerErrorException(result.output);
        }
    }
    async removeContainer(pId, uId) {
        const project = await this.findProjectOrThrow(pId, uId);
        const filePath = this.composeFileService.getComposeFilePath(project.id);
        const result = await this.dockerCliService.down(filePath);
        if (result.success) {
            project.status = project_status_enum_1.ProjectStatus.STOPPED;
            await this.composeFileService.deleteProjectDir(project.id);
            return await this.projectRepository.save(project);
        }
        else {
            throw new common_1.InternalServerErrorException(result.output);
        }
    }
};
exports.ContainerLifecycleService = ContainerLifecycleService;
exports.ContainerLifecycleService = ContainerLifecycleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.ProjectEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        compose_file_service_1.ComposeFileService,
        docker_cli_service_1.DockerCliService])
], ContainerLifecycleService);
//# sourceMappingURL=container-lifecycle.service.js.map