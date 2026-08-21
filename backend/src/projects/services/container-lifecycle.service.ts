import { InjectRepository } from "@nestjs/typeorm";
import { ProjectEntity } from "../entities/project.entity";
import { ComposeFileService } from "./compose-file.service";
import { DockerCliService } from "./docker-cli.service";
import { Repository } from "typeorm";
import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { ProjectStatus } from "../enums/project-status.enum";
import { HealthcheckService } from "./healthcheck.service";

@Injectable()
export class ContainerLifecycleService {
    constructor(
        @InjectRepository(ProjectEntity)
        private readonly projectRepository: Repository<ProjectEntity>,
            private readonly composeFileService: ComposeFileService,
                private readonly dockerCliService: DockerCliService,
                    private readonly healthcheckService: HealthcheckService,
    ) {}

    private async findProjectOrThrow(projectId: string, userId: string): Promise<ProjectEntity> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        if (project.userId !== userId) {
            throw new ForbiddenException('You do not have access to this project');
        }

        return project;
    }

    async startContainer(pId: string, uId: string) {
        const project = await this.findProjectOrThrow(pId, uId);
        if(!project.dockerConfig){
            throw new BadRequestException("dockerConfig is missing, technology selection required");
        }
        project.status = ProjectStatus.PROVISIONING;
        await this.projectRepository.save(project);
        const filePath = await this.composeFileService.writeComposeFile(project.id, project.dockerConfig);
        const result = await this.dockerCliService.up(filePath);

        if (!result.success) {
            project.status = ProjectStatus.STOPPED;
            await this.projectRepository.save(project);
            throw new InternalServerErrorException(result.output);
        }

        const isHealthy = await this.healthcheckService.waitUntilHealthy(filePath);
        if (isHealthy) {
            project.status = ProjectStatus.RUNNING;
            return await this.projectRepository.save(project);
        } else {
            project.status = ProjectStatus.STOPPED;
            await this.projectRepository.save(project);
            throw new InternalServerErrorException('Containers did not become healthy within the timeout period');
        }
    }

    async stopContainer (pId: string, uId: string) {
        const project = await this.findProjectOrThrow(pId, uId);
        const filePath = this.composeFileService.getComposeFilePath(project.id);
        const result = await this.dockerCliService.stop(filePath);

        if(result.success){
            project.status = ProjectStatus.STOPPED;
            return await this.projectRepository.save(project);
        }else {
            throw new InternalServerErrorException(result.output);
        }
    }

    async removeContainer (pId: string, uId: string) {
        const project = await this.findProjectOrThrow(pId, uId);
        const filePath = this.composeFileService.getComposeFilePath(project.id);
        const result = await this.dockerCliService.down(filePath);

        if(result.success){
            project.status = ProjectStatus.STOPPED;
            await this.composeFileService.deleteProjectDir(project.id);
            return await this.projectRepository.save(project)
        }else {
            throw new InternalServerErrorException(result.output);
        }
    }
}
