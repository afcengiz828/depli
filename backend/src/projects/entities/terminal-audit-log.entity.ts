import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('terminal_audit_logs')
export class TerminalAuditLogEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    projectId: string;

    @Column({ type: 'uuid' })
    userId: string;

    @Column({ type: 'text' })
    command: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;
}
