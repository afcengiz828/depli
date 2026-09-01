
import { Injectable } from '@nestjs/common';
import { dump } from 'js-yaml';
import { ImagesList, techStack as techStackConfig } from '../config/tech-stack.config';
import { TechStackService } from './tech-stack.service';

const RESOURCE_LIMITS = {
  cpus: '0.5',
  memory: '512M',
};

@Injectable()
export class DockerTemplateService {
  private techStackService: TechStackService;

  constructor() {
    this.techStackService = new TechStackService();
  }

  generateDockerComposeYml(techStack: any): string {
    this.validateTechStack(techStack);

    const backendKey = techStack.backend;
    const frontendKey = techStack.frontend;
    const databaseKey = techStack.database;

    const backendVersion = techStack.backendVersion;
    const frontendVersion = techStack.frontendVersion;
    const databaseVersion = techStack.databaseVersion;

    const backendImage = this.buildImageName(
      techStackConfig.backend,
      backendKey,
      backendVersion
    );

    const frontendImage = this.buildImageName(
      techStackConfig.frontend,
      frontendKey,
      frontendVersion
    );

    const databaseImage = this.buildImageName(
      techStackConfig.database,
      databaseKey,
      databaseVersion
    );

    const databaseConfig = this.buildDatabaseConfig(databaseKey);

    const composeYaml = {
      services: {
        backend: {
          image: backendImage,
          ports: [this.getBackendPort(backendKey)],
          depends_on: ['database'],
          environment: ['NODE_ENV=production', `PORT=${this.getBackendPortValue(backendKey)}`],
          deploy: {
            resources: {
              limits: RESOURCE_LIMITS,
            },
          },
        },
        frontend: {
          image: frontendImage,
          ports: ['80:80'],
          depends_on: ['backend'],
          deploy: {
            resources: {
              limits: RESOURCE_LIMITS,
            },
          },
        },
        database: {
          image: databaseImage,
          environment: databaseConfig.environment,
          volumes: databaseConfig.volumes,
          deploy: {
            resources: {
              limits: RESOURCE_LIMITS,
            },
          },
        },
      },
      volumes: {
        db_data: null,
      },
    };

    return dump(composeYaml);
  }

  generateDockerComposeYmlFromPreset(presetName: string): string {
    const preset = ImagesList.find((item: any) => item.name === presetName);

    if (!preset) {
      throw new Error('Invalid preset name');
    }

    return this.generateDockerComposeYml(preset.techStack);
  }

  private validateTechStack(techStack: any): void {
  // Önce alan varlığını kontrol et (undefined/null için)
  const requiredFields = ['backend', 'backendVersion', 'frontend', 'frontendVersion', 'database', 'databaseVersion'];
  
  for (const field of requiredFields) {
    if (techStack[field] === undefined || techStack[field] === null) {
      throw new Error('Missing required properties');
    }
  }

  // Sonra boş string kontrolü
  const hasEmptyString = Object.values(techStack).some(
    (value) => typeof value === 'string' && value.trim() === ''
  );
  if (hasEmptyString) {
    throw new Error('Empty properties');
  }

  // Son olarak geçerlilik kontrolü
  if (!this.techStackService.isValidTechStack(techStack)) {
    throw new Error('Invalid tech stack combination');
  }
}

  private buildImageName(category: any, key: string, version: string): string {
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

  private buildDatabaseConfig(database: string): { environment: string[]; volumes: string[] } {
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


  private getBackendPort(backend: string): string {
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

  private getBackendPortValue(backend: string): string {
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
}
