import * as fs from 'fs/promises';
import { ComposeFileService } from './compose-file.service';
import * as path from 'path';

describe('Compose File Tests', () => {
    let service: ComposeFileService;
    const TEST_WORKSPACE = '/tmp/depli-test-workspace';

    beforeEach(async () => {
        await fs.rm(TEST_WORKSPACE, { recursive: true, force: true });
        process.env.DEPLI_WORKSPACE_DIR = TEST_WORKSPACE;
        service = new ComposeFileService();
    });

    afterEach(async () => {
        await fs.rm(TEST_WORKSPACE, { recursive: true, force: true });
    });

    afterAll(() => {
        delete process.env.DEPLI_WORKSPACE_DIR;
    });

    const sampleYaml = (imageTag = 'node:20.5.0-alpine') => `services:
    backend:
    image: ${imageTag}
    ports:
    - "3000:3000"
    depends_on:
    - database
    database:
    image: postgres:16-alpine
    environment:
    - POSTGRES_PASSWORD=\${DB_PASSWORD}
    - POSTGRES_USER=\${DB_USER}
    - POSTGRES_DB=\${DB_NAME}
    volumes:
    - db_data:/var/lib/postgresql/data
    volumes:
    db_data:
    `;

    describe('getComposeFilePath', () => {
        it('should return the correct compose file path for a valid projectId', () => {
            const projectId = 'a1b2c3d4-e5f6-47a8-9b3c-1d2e3f4a5b6c';
            const expectedValue = path.join(TEST_WORKSPACE, projectId, 'docker-compose.yml');
            expect(service.getComposeFilePath(projectId)).toBe(expectedValue);
        });

        it('should throw an error for path traversal attempts', () => {
            const projectId = '../../etc/passwd';
            expect(() => service.getComposeFilePath(projectId)).toThrow();
        });

        it('should throw an error for empty projectId', () => {
            expect(() => service.getComposeFilePath('')).toThrow();
        });

        it('should throw an error for projectId containing null bytes or special characters', () => {
            const projectId = 'a1b2c3d4-e5f6-47a8-9b3c-1d2e3f4a5b\0';
            expect(() => service.getComposeFilePath(projectId)).toThrow();
        });
    });

    describe('writeComposeFile', () => {
        const testProjectId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

        it('should create the project directory if it does not exist', async () => {
            const projectDir = path.join(TEST_WORKSPACE, testProjectId);

            await expect(fs.access(projectDir)).rejects.toThrow();

            await service.writeComposeFile(testProjectId, sampleYaml());

            await expect(fs.access(projectDir)).resolves.not.toThrow();
        });

        it('should write the yaml content to the compose file', async () => {
            const yaml = sampleYaml();
            const filePath = await service.writeComposeFile(testProjectId, yaml);

            const content = await fs.readFile(filePath, 'utf-8');
            expect(content).toBe(yaml);
        });

        it('should return the file path after writing', async () => {
            const expectedPath = path.join(TEST_WORKSPACE, testProjectId, 'docker-compose.yml');
            const result = await service.writeComposeFile(testProjectId, sampleYaml());
            expect(result).toBe(expectedPath);
        });

        it('should overwrite existing compose file if called again', async () => {
            const oldYaml = sampleYaml('node:20.5.0-alpine');
            const newYaml = sampleYaml('node:22.11.0-alpine');

            await service.writeComposeFile(testProjectId, oldYaml);
            const filePath = await service.writeComposeFile(testProjectId, newYaml);

            const content = await fs.readFile(filePath, 'utf-8');
            expect(content).toBe(newYaml);
        });

        it('should throw an error when writing with an invalid projectId', async () => {
            const invalidProjectId = 'f47ac10b-58cc-4372-a567-0e02b2c3d4\0';
            await expect(service.writeComposeFile(invalidProjectId, sampleYaml())).rejects.toThrow();
        });
    });

    describe('composeFileExists', () => {
        const testProjectId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

        it('should return true when compose file exists', async () => {
            await service.writeComposeFile(testProjectId, sampleYaml());
            expect(await service.composeFileExists(testProjectId)).toBe(true);
        });

        it('should return false when compose file does not exist', async () => {
            expect(await service.composeFileExists(testProjectId)).toBe(false);
        });

        it('should return false when only the directory exists but not the file', async () => {
            const projectDir = path.join(TEST_WORKSPACE, testProjectId);
            await fs.mkdir(projectDir, { recursive: true });
            expect(await service.composeFileExists(testProjectId)).toBe(false);
        });
    });

    describe('deleteProjectDir', () => {
        const testProjectId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

        it('should delete the compose file', async () => {
            await service.writeComposeFile(testProjectId, sampleYaml());
            await service.deleteProjectDir(testProjectId);
            expect(await service.composeFileExists(testProjectId)).toBe(false);
        });

        it('should delete the entire project directory, not just the file', async () => {
            await service.writeComposeFile(testProjectId, sampleYaml());
            await service.deleteProjectDir(testProjectId);

            const projectDir = path.join(TEST_WORKSPACE, testProjectId);
            await expect(fs.access(projectDir)).rejects.toThrow();
        });

        it('should not throw an error when deleting a non-existent project directory', async () => {
            await expect(service.deleteProjectDir(testProjectId)).resolves.not.toThrow();
        });

        it('should throw an error when deleting with an invalid projectId', async () => {
            const invalidProjectId = 'f47ac10b-58cc-4372-a567-0e02b2c3d4\0';
            await expect(service.deleteProjectDir(invalidProjectId)).rejects.toThrow();
        });
    });

    describe('getRepoPath', () => {
        it('should return the correct repo path for a valid projectId', () => {
            const projectId = 'a1b2c3d4-e5f6-47a8-9b3c-1d2e3f4a5b6c';
            const expectedPath = path.join(TEST_WORKSPACE, projectId, 'repo');
            expect(service.getRepoPath(projectId)).toBe(expectedPath);
        });

        it('should throw an error for path traversal attempts', () => {
            expect(() => service.getRepoPath('../../etc/passwd')).toThrow();
        });
    });
});
