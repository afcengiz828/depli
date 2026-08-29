import { Injectable, Inject, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../entities/project.entity';
import { DnsProviderClient } from '../interfaces/dns-provider.interface';

@Injectable()
export class DomainAssignmentService {
    constructor(
        @InjectRepository(ProjectEntity)
        private readonly projectRepository: Repository<ProjectEntity>,
            @Inject('DNS_PROVIDER_CLIENT')
            private readonly dnsProviderClient: DnsProviderClient,
    ) {}

    async assignDomain(projectId: string, userId: string): Promise<ProjectEntity> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        if (project.userId !== userId) {
            throw new ForbiddenException('You do not have access to this project');
        }

        if (project.domain) {
            throw new ConflictException('Project already has a domain assigned');
        }

        const domain = `${projectId}.depli.dev`;
        const placeholderIp = '127.0.0.1';

        await this.dnsProviderClient.createRecord(domain, placeholderIp);

        project.domain = domain;
        return await this.projectRepository.save(project);
    }
}
