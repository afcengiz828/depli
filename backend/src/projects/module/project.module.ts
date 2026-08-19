import { Module } from "@nestjs/common";
import { ProjectController } from "../controllers/project.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectService } from "../services/project.service";
import { GithubIntegrationService } from "../services/github-integration.service";
import { TechStackService } from "../services/tech-stack.service";
import { DockerTemplateService } from "../services/docker-template.service";
import { EncryptionService } from "../services/encryption.service";
import { ProjectEntity } from "../entities/project.entity";
import { AuthModule } from "../../auth/auth.module";
import { ComposeFileService } from "../services/compose-file.service";
import { DockerCliService } from "../services/docker-cli.service";
import { ContainerLifecycleService } from "../services/container-lifecycle.service";
import { ContainerController } from "../controllers/container.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([ProjectEntity]), 
        AuthModule
    ],
    controllers: [ContainerController, ProjectController],
    providers: [
        ProjectService,
        GithubIntegrationService,
        TechStackService,
        DockerTemplateService,
        EncryptionService,
        ComposeFileService,
        DockerCliService,
        ContainerLifecycleService,
    ]
})
export class ProjectModule {}
