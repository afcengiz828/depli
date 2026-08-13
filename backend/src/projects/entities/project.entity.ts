import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    UpdateDateColumn,
} from "typeorm";
import { ProjectStatus } from "../enums/project-status.enum";
import { User } from "../../users/entities/user.entity";


@Entity({ name: "projects" })
export class ProjectEntity {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 255 })
    name: string;

    @Column({
        type: "enum",
        enum: ProjectStatus,
        default: ProjectStatus.PROVISIONING,
    })
    status: ProjectStatus;

    @Column({ type: "varchar", length: 255, nullable: true })
    githubUrl: string;

    @Column({ nullable: true })
    githubToken?: string;

    @Column({ type: "jsonb"})
    techStack: Record<string, any>;

    @CreateDateColumn({ type: "timestamp with time zone" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp with time zone" })
    updatedAt: Date;
    
    @Column({ type: "uuid"})
    userId: string;

    @ManyToOne(() => User, (user: User) => user.projects, { onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: 'text', nullable: true })
    dockerConfig: string;
}
