import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ProjectEntity } from '../entities/project.entity';

const WARNING_THRESHOLD_DAYS = 7;

@Injectable()
export class RenewalAlertService {
    private readonly logger = new Logger(RenewalAlertService.name);

    constructor(
        @InjectRepository(ProjectEntity)
        private readonly projectRepository: Repository<ProjectEntity>,
    ) {}

    async checkExpiringCertificates(): Promise<void> {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() + WARNING_THRESHOLD_DAYS);

        const activeProjects = await this.projectRepository.find({
            where: {
                sslStatus: 'active',
                sslExpiresAt: LessThan(thresholdDate),
            },
        });

        for (const project of activeProjects) {
            this.logger.warn(
                `SSL certificate for ${project.domain} is expiring on ${project.sslExpiresAt}`,
            );
        }
    }
}
