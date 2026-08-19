import { ContainerLifecycleService } from '../services/container-lifecycle.service';
export declare class ContainerController {
    private readonly containerService;
    constructor(containerService: ContainerLifecycleService);
    start(id: string, req: any): Promise<import("../entities/project.entity").ProjectEntity>;
    stop(id: string, req: any): Promise<import("../entities/project.entity").ProjectEntity>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
}
