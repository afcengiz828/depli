import { InjectRepository } from "@nestjs/typeorm";
import { ProjectEntity } from "../entities/project.entity";
import { ComposeFileService } from "./compose-file.service";
import { DockerCliService } from "./docker-cli.service";
import { Repository } from "typeorm";
import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { ProjectStatus } from "../enums/project-status.enum";
import { HealthcheckService } from "./healthcheck.service";
import { DomainAssignmentService } from "./domain-assignment.service";
import { SslCertificateService } from "./ssl-certificate.service";
import {EncryptionService} from "./encryption.service";
import { DockerTemplateService } from "./docker-template.service";
import { GitCloneService } from "./git-clone.service";
import * as fs from 'fs/promises';
@Injectable()
export class ContainerLifecycleService {
    constructor(
        @InjectRepository(ProjectEntity)
        private readonly projectRepository: Repository<ProjectEntity>,
            private readonly composeFileService: ComposeFileService,
                private readonly dockerCliService: DockerCliService,
                    private readonly healthcheckService: HealthcheckService,
                        private readonly domainAssignmentService: DomainAssignmentService,
                            private readonly sslCertificateService: SslCertificateService,
                                private readonly encryptionService: EncryptionService,
                                    private readonly gitCloneService: GitCloneService,
                                        private readonly dockerTemplateService: DockerTemplateService,
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
        if (!project.techStack) {
            throw new BadRequestException("techStack is missing, technology selection required");
        }
        project.status = ProjectStatus.PROVISIONING;
        await this.projectRepository.save(project);

        const decryptedEnv: Record<string, string> = {};
        if (project.envVariables) {
            for (const [key, encryptedValue] of Object.entries(project.envVariables)) {
                decryptedEnv[key] = this.encryptionService.decrypt(encryptedValue);
            }
        }

        const repoPath = this.composeFileService.getRepoPath(project.id);
        const repoExists = await this.checkRepoExists(repoPath);

        if (!repoExists) {
            const token = project.githubToken
            ? this.encryptionService.decrypt(project.githubToken)
            : undefined;
            await this.gitCloneService.cloneRepository(project.githubUrl, repoPath, token);
        }

        const dockerConfig = this.dockerTemplateService.generateDockerComposeYml(project.techStack, repoPath);

        const filePath = await this.composeFileService.writeComposeFile(project.id, dockerConfig);
        const result = await this.dockerCliService.up(filePath, decryptedEnv);

        if (!result.success) {
            project.status = ProjectStatus.STOPPED;
            await this.projectRepository.save(project);
            throw new InternalServerErrorException(result.output);
        }

        const isHealthy = await this.healthcheckService.waitUntilHealthy(filePath);

        if (!isHealthy) {
            project.status = ProjectStatus.STOPPED;
            await this.projectRepository.save(project);
            throw new InternalServerErrorException('Containers did not become healthy within the timeout period');
        }

        if (!project.domain) {
            try {
                await this.domainAssignmentService.assignDomain(pId, uId);
            } catch (error) {
                // Domain ataması başarısız olsa bile konteynır çalışmaya devam eder
            }
        }

        if (!project.sslStatus || project.sslStatus === 'failed') {
            try {
                await this.sslCertificateService.issueCertificate(pId, uId);
            } catch (error) {
                // SSL sertifikası başarısız olsa bile konteynır çalışmaya devam eder
            }
        }

        project.status = ProjectStatus.RUNNING;
        project.dockerConfig = dockerConfig;
        return await this.projectRepository.save(project);
    }

    private async checkRepoExists(repoPath: string): Promise<boolean> {
        try {
            await fs.access(repoPath);
            return true;
        } catch {
            return false;
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
