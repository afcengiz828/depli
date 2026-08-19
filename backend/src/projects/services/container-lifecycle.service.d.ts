import { ProjectEntity } from "../entities/project.entity";
import { ComposeFileService } from "./compose-file.service";
import { DockerCliService } from "./docker-cli.service";
import { Repository } from "typeorm";
export declare class ContainerLifecycleService {
    private readonly projectRepository;
    private readonly composeFileService;
    private readonly dockerCliService;
    constructor(projectRepository: Repository<ProjectEntity>, composeFileService: ComposeFileService, dockerCliService: DockerCliService);
    private findProjectOrThrow;
    startContainer(pId: string, uId: string): Promise<ProjectEntity>;
    stopContainer(pId: string, uId: string): Promise<ProjectEntity>;
    removeContainer(pId: string, uId: string): Promise<ProjectEntity>;
}
