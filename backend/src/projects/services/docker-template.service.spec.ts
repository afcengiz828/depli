import * as yaml from 'js-yaml';
import { DockerTemplateService } from './docker-template.service';

describe('DockerTemplateService', () => {
  let service: DockerTemplateService;

  const validCombination = {
    backend: 'nodejs',
    backendVersion: '20.5.0',
    frontend: 'react',
    frontendVersion: '18.2.0',
    database: 'postgresql',
    databaseVersion: '16'
  };

  beforeEach(() => {
    service = new DockerTemplateService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a non-empty string', () => {
    const result = service.generateDockerComposeYml(validCombination);
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).not.toEqual('');
  });

  it('should generate valid YAML', () => {
    const result = service.generateDockerComposeYml(validCombination);
    let parsed: any;
    try {
      parsed = yaml.load(result);
    } catch (e) {
      throw new Error('Generated content is not valid YAML');
    }
    expect(parsed).toBeDefined();
  });

  it('should contain correct service names', () => {
    const result = service.generateDockerComposeYml(validCombination);
    const parsed = yaml.load(result) as any;
    expect(parsed.services).toHaveProperty('backend');
    expect(parsed.services).toHaveProperty('frontend');
    expect(parsed.services).toHaveProperty('database');
  });

  it('should use correct images', () => {
    const result = service.generateDockerComposeYml(validCombination);
    const parsed = yaml.load(result) as any;
    expect(parsed.services.backend.image).toBe('node:20.5.0-alpine');
    expect(parsed.services.frontend.image).toBe('node:18.2.0-alpine');
    expect(parsed.services.database.image).toBe('postgres:16-alpine');
  });

  it('should set correct database environment variables for postgresql', () => {
    const result = service.generateDockerComposeYml(validCombination);
    const parsed = yaml.load(result) as any;
    const env = parsed.services.database.environment;
    expect(env).toContain('POSTGRES_PASSWORD=${DB_PASSWORD}');
    expect(env).toContain('POSTGRES_USER=${DB_USER}');
    expect(env).toContain('POSTGRES_DB=${DB_NAME}');
  });

  it('should set correct database environment variables for mysql', () => {
    const mysqlCombination = { ...validCombination, database: 'mysql', databaseVersion: '8.0' };
    const result = service.generateDockerComposeYml(mysqlCombination);
    const parsed = yaml.load(result) as any;
    const env = parsed.services.database.environment;
    expect(env).toContain('MYSQL_ROOT_PASSWORD=${DB_PASSWORD}');
    expect(env).toContain('MYSQL_DATABASE=${DB_NAME}');
  });

  it('should define volumes', () => {
    const result = service.generateDockerComposeYml(validCombination);
    const parsed = yaml.load(result) as any;
    expect(parsed).toHaveProperty('volumes');
  });

  it('should set correct depends_on', () => {
    const result = service.generateDockerComposeYml(validCombination);
    const parsed = yaml.load(result) as any;
    expect(parsed.services.backend.depends_on).toContain('database');
    expect(parsed.services.frontend.depends_on).toContain('backend');
  });

  it('should throw for invalid combination', () => {
    expect(() => service.generateDockerComposeYml({
      backend: 'cobol',
      backendVersion: '1.0',
      frontend: 'html',
      frontendVersion: '1.0',
      database: 'oracle',
      databaseVersion: '1.0'
    })).toThrow('Invalid tech stack combination');
  });

  it('should throw for missing properties', () => {
    expect(() => service.generateDockerComposeYml({
      backend: 'nodejs',
      backendVersion: '20.5.0',
      frontend: 'react',
      frontendVersion: '18.2.0'
    } as any)).toThrow('Missing required properties');
  });

  it('should throw for empty properties', () => {
    expect(() => service.generateDockerComposeYml({
      backend: '',
      backendVersion: '',
      frontend: '',
      frontendVersion: '',
      database: '',
      databaseVersion: ''
    })).toThrow('Empty properties');
  });

    it('should generate from preset', () => {
    const result = service.generateDockerComposeYmlFromPreset('MERN Stack');
    const parsed = yaml.load(result) as any;
    expect(parsed).toHaveProperty('services');
    expect(parsed.services).toHaveProperty('backend');
    expect(parsed.services).toHaveProperty('frontend');
    expect(parsed.services).toHaveProperty('database');
  });

  it('should throw for invalid preset name', () => {
    expect(() => service.generateDockerComposeYmlFromPreset('COBOL Stack'))
      .toThrow('Invalid preset name');
  });

  describe('resource limits', () => {
    it('should include resource limits for backend service', () => {
      const result = service.generateDockerComposeYml(validCombination);
      const parsed = yaml.load(result) as any;

      expect(parsed.services.backend.deploy.resources.limits.cpus).toBe('0.5');
      expect(parsed.services.backend.deploy.resources.limits.memory).toBe('512M');
    });

    it('should include resource limits for frontend service', () => {
      const result = service.generateDockerComposeYml(validCombination);
      const parsed = yaml.load(result) as any;

      expect(parsed.services.frontend.deploy.resources.limits.cpus).toBe('0.5');
      expect(parsed.services.frontend.deploy.resources.limits.memory).toBe('512M');
    });

    it('should include resource limits for database service', () => {
      const result = service.generateDockerComposeYml(validCombination);
      const parsed = yaml.load(result) as any;

      expect(parsed.services.database.deploy.resources.limits.cpus).toBe('0.5');
      expect(parsed.services.database.deploy.resources.limits.memory).toBe('512M');
    });

    it('should apply the same resource limit values across all services', () => {
      const result = service.generateDockerComposeYml(validCombination);
      const parsed = yaml.load(result) as any;

      const backendLimits = parsed.services.backend.deploy.resources.limits;
      const frontendLimits = parsed.services.frontend.deploy.resources.limits;
      const databaseLimits = parsed.services.database.deploy.resources.limits;

      expect(backendLimits).toEqual(frontendLimits);
      expect(frontendLimits).toEqual(databaseLimits);
    });
  });
});
