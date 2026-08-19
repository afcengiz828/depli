import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs/promises';
import { AuthModule } from '../src/auth/auth.module';
import { ProjectModule } from '../src/projects/module/project.module';
import { User } from '../src/users/entities/user.entity';
import { ProjectEntity } from '../src/projects/entities/project.entity';
import { ProjectStatus } from '../src/projects/enums/project-status.enum';

describe('Container Lifecycle (e2e)', () => {
    let app: INestApplication;
    let container: StartedPostgreSqlContainer;
    let authToken: string;
    let projectId: string;

    const testWorkspaceDir = '/tmp/depli-e2e-workspace';

    beforeAll(async () => {
        container = await new PostgreSqlContainer('postgres:16').start();
        process.env.JWT_SECRET = 'container-e2e-test-secret';
        process.env.DEPLI_WORKSPACE_DIR = testWorkspaceDir;
        process.env.ENCRYPTION_KEY = 'e2e-test-encryption-key-32-chars';

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: container.getHost(),
                    port: container.getPort(),
                    username: container.getUsername(),
                    password: container.getPassword(),
                    database: container.getDatabase(),
                    entities: [User, ProjectEntity],
                    synchronize: true,
                }),
                AuthModule,
                ProjectModule,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        // Test kullanıcısı oluştur ve token al
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'container-e2e@depli.com', password: 'securePass123' });

        const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'container-e2e@depli.com', password: 'securePass123' });

        authToken = loginResponse.body.accessToken;

        // Gerçekten Docker'da çalışabilecek, hafif bir proje oluştur
        // (imaj indirme süresini minimize etmek için alpine tabanlı, tek servisli bir stack)
        const createRes = await request(app.getHttpServer())
            .post('/projects')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Container E2E Test Project',
                githubUrl: 'https://github.com/facebook/react',
                techStack: {
                    backend: 'nodejs',
                    backendVersion: '20.5.0',
                    frontend: 'react',
                    frontendVersion: '18.2.0',
                    database: 'redis',
                    databaseVersion: '7.0',
                },
            });

        console.log('CREATE PROJECT STATUS:', createRes.status);
        console.log('CREATE PROJECT BODY:', JSON.stringify(createRes.body));

        projectId = createRes.body.id;

        console.log('PROJECT ID SET TO:', projectId);
    });


    afterAll(async () => {
        // Kalıntı konteynırları temizlemeye çalış (varsa)
        try {
            await request(app.getHttpServer())
                .delete(`/projects/${projectId}/container`)
                .set('Authorization', `Bearer ${authToken}`);
        } catch {
            // temizlik başarısız olursa sessizce geç, testin sonucunu etkilemesin
        }

        await fs.rm(testWorkspaceDir, { recursive: true, force: true });
        await app.close();
        await container.stop();
    }, 60000);

    describe('POST /projects/:id/start', () => {
        it('should reject start without token', () => {
            return request(app.getHttpServer())
                .post(`/projects/${projectId}/start`)
                .expect(401);
        });

        it('should start the container and set status to running', async () => {
            const response = await request(app.getHttpServer())
                .post(`/projects/${projectId}/start`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(201);

            expect(response.body.status).toBe(ProjectStatus.RUNNING);
        }, 90000);

        it('should have written the compose file to disk', async () => {
            const composeFilePath = `${testWorkspaceDir}/${projectId}/docker-compose.yml`;
            const content = await fs.readFile(composeFilePath, 'utf-8');
            expect(content).toContain('services:');
        });
    });

    describe('POST /projects/:id/stop', () => {
        it('should reject stop without token', () => {
            return request(app.getHttpServer())
                .post(`/projects/${projectId}/stop`)
                .expect(401);
        });

        it('should stop the container and set status to stopped', async () => {
            const response = await request(app.getHttpServer())
                .post(`/projects/${projectId}/stop`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(201);

            expect(response.body.status).toBe(ProjectStatus.STOPPED);
        }, 30000);
    });

    describe('DELETE /projects/:id/container', () => {
        it('should reject removal without token', () => {
            return request(app.getHttpServer())
                .delete(`/projects/${projectId}/container`)
                .expect(401);
        });

        it('should remove the container and delete compose files', async () => {
            await request(app.getHttpServer())
                .delete(`/projects/${projectId}/container`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const composeFilePath = `${testWorkspaceDir}/${projectId}/docker-compose.yml`;
            await expect(fs.access(composeFilePath)).rejects.toThrow();
        }, 30000);
    });

    describe('Ownership checks', () => {
        let otherUserToken: string;

        beforeAll(async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ email: 'other-container-user@depli.com', password: 'securePass123' });

            const loginRes = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: 'other-container-user@depli.com', password: 'securePass123' });

            otherUserToken = loginRes.body.accessToken;
        });

        it('should reject starting another users container', () => {
            return request(app.getHttpServer())
                .post(`/projects/${projectId}/start`)
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(403);
        });

        it('should reject stopping another users container', () => {
            return request(app.getHttpServer())
                .post(`/projects/${projectId}/stop`)
                .set('Authorization', `Bearer ${otherUserToken}`)
                .expect(403);
        });
    });
});
