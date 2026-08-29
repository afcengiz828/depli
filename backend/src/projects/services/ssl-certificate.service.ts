import { Injectable, Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../entities/project.entity';
import { AcmeClient } from '../interfaces/acme-client.interface';

@Injectable()
export class SslCertificateService {
    constructor(
        @InjectRepository(ProjectEntity)
        private readonly projectRepository: Repository<ProjectEntity>,
            @Inject('ACME_CLIENT')
            private readonly acmeClient: AcmeClient,
    ) {}

    async issueCertificate(projectId: string, userId: string): Promise<ProjectEntity> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        if (project.userId !== userId) {
            throw new ForbiddenException('You do not have access to this project');
        }

        if (!project.domain) {
            throw new BadRequestException('Project must have a domain assigned before requesting SSL certificate');
        }

        try {
            const { expiresAt } = await this.acmeClient.requestCertificate(project.domain);
            project.sslStatus = 'active';
            project.sslExpiresAt = expiresAt;
            return await this.projectRepository.save(project);
        } catch (error) {
            project.sslStatus = 'failed';
            await this.projectRepository.save(project);
            throw error;
        }
    }
}
