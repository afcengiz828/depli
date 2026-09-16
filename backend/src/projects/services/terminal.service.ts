import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../entities/project.entity';
import { ComposeFileService } from './compose-file.service';
import { DockerCliService } from './docker-cli.service';
import { EncryptionService } from './encryption.service';

@Injectable()
export class TerminalService {
    constructor(
        @InjectRepository(ProjectEntity)
        private readonly projectRepository: Repository<ProjectEntity>,
            private readonly composeFileService: ComposeFileService,
                private readonly dockerCliService: DockerCliService,
                    private readonly encryptionService: EncryptionService,
    ) {}

    async startTerminal(
        projectId: string,
        userId: string,
        serviceName: string,
        onData: (chunk: string) => void,
    ): Promise<{ write: (input: string) => void; stop: () => void }> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        if (project.userId !== userId) {
            throw new ForbiddenException('You do not have access to this project');
        }

        const filePath = this.composeFileService.getComposeFilePath(projectId);

        const decryptedEnv: Record<string, string> = {};
        if (project.envVariables) {
            for (const [key, encryptedValue] of Object.entries(project.envVariables)) {
                decryptedEnv[key] = this.encryptionService.decrypt(encryptedValue);
            }
        }

        return this.dockerCliService.execInteractive(filePath, serviceName, onData, decryptedEnv);
    }
}
