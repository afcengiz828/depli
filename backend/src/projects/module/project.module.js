"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectModule = void 0;
const common_1 = require("@nestjs/common");
const project_controller_1 = require("../controllers/project.controller");
const typeorm_1 = require("@nestjs/typeorm");
const project_service_1 = require("../services/project.service");
const github_integration_service_1 = require("../services/github-integration.service");
const tech_stack_service_1 = require("../services/tech-stack.service");
const docker_template_service_1 = require("../services/docker-template.service");
const encryption_service_1 = require("../services/encryption.service");
const project_entity_1 = require("../entities/project.entity");
const auth_module_1 = require("../../auth/auth.module");
const compose_file_service_1 = require("../services/compose-file.service");
const docker_cli_service_1 = require("../services/docker-cli.service");
const container_lifecycle_service_1 = require("../services/container-lifecycle.service");
const container_controller_1 = require("../controllers/container.controller");
let ProjectModule = class ProjectModule {
};
exports.ProjectModule = ProjectModule;
exports.ProjectModule = ProjectModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([project_entity_1.ProjectEntity]),
            auth_module_1.AuthModule
        ],
        controllers: [project_controller_1.ProjectController, container_controller_1.ContainerController],
        providers: [
            project_service_1.ProjectService,
            github_integration_service_1.GithubIntegrationService,
            tech_stack_service_1.TechStackService,
            docker_template_service_1.DockerTemplateService,
            encryption_service_1.EncryptionService,
            compose_file_service_1.ComposeFileService,
            docker_cli_service_1.DockerCliService,
            container_lifecycle_service_1.ContainerLifecycleService,
        ]
    })
], ProjectModule);
//# sourceMappingURL=project.module.js.map