import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../entities/project.entity';
import { ComposeFileService } from './compose-file.service';
import { DockerCliService } from './docker-cli.service';

@Injectable()
export class LogStreamService {
    constructor(
        @InjectRepository(ProjectEntity)
        private readonly projectRepository: Repository<ProjectEntity>,
            private readonly composeFileService: ComposeFileService,
                private readonly dockerCliService: DockerCliService,
    ) {}

    async startStreaming(
        projectId: string,
        userId: string,
        onData: (chunk: string) => void,
    ): Promise<{ stop: () => void }> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        if (project.userId !== userId) {
            throw new ForbiddenException('You do not have access to this project');
        }

        const filePath = this.composeFileService.getComposeFilePath(projectId);

        return this.dockerCliService.streamLogs(filePath, onData);
    }
}
