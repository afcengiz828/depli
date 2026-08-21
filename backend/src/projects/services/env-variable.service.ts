import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EncryptionService } from "./encryption.service";
import { ProjectEntity } from "../entities/project.entity";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

@Injectable()
export class EnvVariableService {
    constructor(
        @InjectRepository(ProjectEntity)
        private readonly projectRepository: Repository<ProjectEntity>,
            private readonly encryptionService: EncryptionService,
    ) {}

    private async findProjectOrThrow(projectId: string, userId: string): Promise<ProjectEntity> {
        const project = await this.projectRepository.findOne({ where: { id: projectId } });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        if (project.userId !== userId) {
            throw new ForbiddenException('You do not have access to this project');
        }

        return project;
    }

    async setEnvVariables (pId: string, uId: string, variables: Record<string, string>) {
        const project: ProjectEntity = await this.findProjectOrThrow(pId, uId);

        const keyPattern = /^[A-Z_][A-Z0-9_]*$/;
        const encryptedVariables: Record<string, string> = {};

        for (const [key, value] of Object.entries(variables)) {
            if(!keyPattern.test(key)){
                throw new BadRequestException(`Invalid environment variable key: ${key}`)
            }
            encryptedVariables[key] = this.encryptionService.encrypt(value);
        }

        project.envVariables = encryptedVariables;
        await this.projectRepository.save(project);

    }

    async getEnvVariableKeys (pId: string, uId: string) {
        const project = await this.findProjectOrThrow(pId, uId);

        if(!project.envVariables){
            return [];
        }

        return Object.keys(project.envVariables);

    }







}
