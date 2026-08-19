"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerTemplateService = void 0;
const common_1 = require("@nestjs/common");
const js_yaml_1 = require("js-yaml");
const tech_stack_config_1 = require("../config/tech-stack.config");
const tech_stack_service_1 = require("./tech-stack.service");
let DockerTemplateService = class DockerTemplateService {
    techStackService;
    constructor() {
        this.techStackService = new tech_stack_service_1.TechStackService();
    }
    generateDockerComposeYml(techStack) {
        this.validateTechStack(techStack);
        const backendKey = techStack.backend;
        const frontendKey = techStack.frontend;
        const databaseKey = techStack.database;
        const backendVersion = techStack.backendVersion;
        const frontendVersion = techStack.frontendVersion;
        const databaseVersion = techStack.databaseVersion;
        const backendImage = this.buildImageName(tech_stack_config_1.techStack.backend, backendKey, backendVersion);
        const frontendImage = this.buildImageName(tech_stack_config_1.techStack.frontend, frontendKey, frontendVersion);
        const databaseImage = this.buildImageName(tech_stack_config_1.techStack.database, databaseKey, databaseVersion);
        const databaseConfig = this.buildDatabaseConfig(databaseKey);
        const composeYaml = {
            services: {
                backend: {
                    image: backendImage,
                    ports: [this.getBackendPort(backendKey)],
                    depends_on: ['database'],
                    environment: ['NODE_ENV=production', `PORT=${this.getBackendPortValue(backendKey)}`],
                },
                frontend: {
                    image: frontendImage,
                    ports: ['80:80'],
                    depends_on: ['backend'],
                },
                database: {
                    image: databaseImage,
                    environment: databaseConfig.environment,
                    volumes: databaseConfig.volumes,
                },
            },
            volumes: {
                db_data: null,
            },
        };
        return (0, js_yaml_1.dump)(composeYaml);
    }
    generateDockerComposeYmlFromPreset(presetName) {
        const preset = tech_stack_config_1.ImagesList.find((item) => item.name === presetName);
        if (!preset) {
            throw new Error('Invalid preset name');
        }
        return this.generateDockerComposeYml(preset.techStack);
    }
    validateTechStack(techStack) {
        const requiredFields = ['backend', 'backendVersion', 'frontend', 'frontendVersion', 'database', 'databaseVersion'];
        for (const field of requiredFields) {
            if (techStack[field] === undefined || techStack[field] === null) {
                throw new Error('Missing required properties');
            }
        }
        const hasEmptyString = Object.values(techStack).some((value) => typeof value === 'string' && value.trim() === '');
        if (hasEmptyString) {
            throw new Error('Empty properties');
        }
        if (!this.techStackService.isValidTechStack(techStack)) {
            throw new Error('Invalid tech stack combination');
        }
    }
    buildImageName(category, key, version) {
        const config = category?.[key];
        if (!config || !config.baseImage) {
            throw new Error('Invalid tech stack combination');
        }
        const baseImage = config.baseImage;
        const imageTag = config.imageTag?.trim();
        if (imageTag) {
            return `${baseImage}:${version}-${imageTag}`;
        }
        return `${baseImage}:${version}`;
    }
    buildDatabaseConfig(database) {
        switch (database) {
            case 'postgresql':
                return {
                    environment: [
                        'POSTGRES_USER=${DB_USER}',
                        'POSTGRES_PASSWORD=${DB_PASSWORD}',
                        'POSTGRES_DB=${DB_NAME}',
                    ],
                    volumes: ['db_data:/var/lib/postgresql/data'],
                };
            case 'mysql':
                return {
                    environment: [
                        'MYSQL_ROOT_PASSWORD=${DB_PASSWORD}',
                        'MYSQL_DATABASE=${DB_NAME}',
                        'MYSQL_USER=${DB_USER}',
                        'MYSQL_PASSWORD=${DB_PASSWORD}',
                    ],
                    volumes: ['db_data:/var/lib/mysql'],
                };
            case 'mongodb':
                return {
                    environment: [
                        'MONGO_INITDB_ROOT_USERNAME=${DB_USER}',
                        'MONGO_INITDB_ROOT_PASSWORD=${DB_PASSWORD}',
                    ],
                    volumes: ['db_data:/data/db'],
                };
            case 'redis':
                return {
                    environment: [],
                    volumes: ['db_data:/data'],
                };
            default:
                return {
                    environment: [],
                    volumes: ['db_data:/data'],
                };
        }
    }
    getBackendPort(backend) {
        switch (backend) {
            case 'nodejs':
                return '3000:3000';
            case 'python':
                return '8000:8000';
            case 'php':
                return '9000:9000';
            case 'java':
            case 'go':
                return '8080:8080';
            default:
                return '8080:8080';
        }
    }
    getBackendPortValue(backend) {
        switch (backend) {
            case 'nodejs':
                return '3000';
            case 'python':
                return '8000';
            case 'php':
                return '9000';
            case 'java':
            case 'go':
                return '8080';
            default:
                return '8080';
        }
    }
};
exports.DockerTemplateService = DockerTemplateService;
exports.DockerTemplateService = DockerTemplateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DockerTemplateService);
//# sourceMappingURL=docker-template.service.js.map