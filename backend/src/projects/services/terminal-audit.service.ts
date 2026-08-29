import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TerminalAuditLogEntity } from '../entities/terminal-audit-log.entity';

@Injectable()
export class TerminalAuditService {
    constructor(
        @InjectRepository(TerminalAuditLogEntity)
        private readonly auditRepository: Repository<TerminalAuditLogEntity>,
    ) {}

    async logCommand(projectId: string, userId: string, command: string): Promise<void> {
        const entry = this.auditRepository.create({
            projectId,
            userId,
            command,
        });

        await this.auditRepository.save(entry);
    }
}
