import { ProjectService } from '../services/project.service';
import { CreateProjectDto } from '../dto/create-project.dto';
export declare class ProjectController {
    private readonly projectService;
    constructor(projectService: ProjectService);
    create(dto: CreateProjectDto, req: any): Promise<import("../entities/project.entity").ProjectEntity>;
    findAll(req: any): Promise<import("../entities/project.entity").ProjectEntity[]>;
    find(id: string, req: any): Promise<import("../entities/project.entity").ProjectEntity>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
