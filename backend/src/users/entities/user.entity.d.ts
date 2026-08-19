import { ProjectEntity } from '../../projects/entities/project.entity';
export declare class User {
    id: string;
    email: string;
    password: string;
    createdAt: Date;
    resetPasswordToken: string | null;
    resetPasswordExpiry: Date | null;
    projects: ProjectEntity[];
}
