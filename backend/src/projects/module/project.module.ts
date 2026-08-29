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
import { HealthcheckService } from "../services/healthcheck.service";
import { EnvVariableService } from "../services/env-variable.service";
import { LogStreamService } from "../services/log-stream.service";
import { WsAuthService } from "../guards/ws-auth.service";
import { LogStreamGateway } from "../services/log-stream.gateway";

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
        HealthcheckService,
        EnvVariableService,
        LogStreamService,
        WsAuthService,
        LogStreamService,
        LogStreamGateway,
    ]
})
export class ProjectModule {}
