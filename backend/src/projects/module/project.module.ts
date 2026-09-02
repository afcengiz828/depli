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
import { DomainAssignmentService } from "../services/domain-assignment.service";
import { MockDnsProviderClient } from "../clients/mock-dns-provider.client";
import { SslCertificateService } from "../services/ssl-certificate.service";
import { MockAcmeClient } from "../clients/mock-acme.client";
import { RenewalAlertService } from "../services/renewal-alert.service";
import { TerminalService } from "../services/terminal.service";
import { TerminalGateway } from "../gateways/terminal.gateway";
import { TerminalAuditService } from "../services/terminal-audit.service";
import { TerminalAuditLogEntity } from "../entities/terminal-audit-log.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([ProjectEntity, TerminalAuditLogEntity]),
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
        LogStreamGateway,
        DomainAssignmentService,
        { provide: 'DNS_PROVIDER_CLIENT', useClass: MockDnsProviderClient },
        SslCertificateService,
        { provide: 'ACME_CLIENT', useClass: MockAcmeClient },
        RenewalAlertService,
        TerminalService,
        TerminalGateway,
        TerminalAuditService,
    ]
})
export class ProjectModule {}
