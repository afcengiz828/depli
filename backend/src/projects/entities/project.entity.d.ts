import { ProjectStatus } from "../enums/project-status.enum";
import { User } from "../../users/entities/user.entity";
export declare class ProjectEntity {
    id: string;
    name: string;
    status: ProjectStatus;
    githubUrl: string;
    githubToken?: string;
    techStack: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    user: User;
    dockerConfig: string;
}
