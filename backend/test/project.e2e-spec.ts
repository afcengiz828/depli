import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { ProjectModule } from '../src/projects/module/project.module';
import { User } from '../src/users/entities/user.entity';
import { ProjectEntity } from '../src/projects/entities/project.entity';


describe("Projects (e2e)", () => {

    let app: INestApplication; // Gerçek nestjs uygulaması. HTTP isteklerini karşılayan sunucu instance ı. 
    let container: StartedPostgreSqlContainer;
    let authToken: string;
    let projectId: string;

    beforeAll(async () => {
        container = await new PostgreSqlContainer("postgres:16").start();
        process.env.JWT_SECRET = "e2e-test-secret";
        process.env.DEPLI_WORKSPACE_DIR = '/tmp/depli-project-e2e-workspace';  
        process.env.ENCRYPTION_KEY = 'e2e-test-encryption-key-32-chars'; 

        // Test modülünü geçici olarak kuruyoruz.
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: "postgres",
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

        await request(app.getHttpServer())
            .post("/auth/register")
            .send({email:"projecttest@depli.com", password: "securePass123"})

        const loginResponse = await request(app.getHttpServer()).post("/auth/login").send({email:"projecttest@depli.com", password: "securePass123"})

        authToken = loginResponse.body.accessToken;

    }, 60000);

    afterAll(async () => {
        await app.close();
        await container.stop();
        delete process.env.DEPLI_WORKSPACE_DIR;
        delete process.env.ENCRYPTION_KEY;
    });

    // Geçerli token ve doğru bilgiler ile proje oluşturulmalı.
    it("should create project with token and valid parameters", () => {
        return request(app.getHttpServer()).post("/projects")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
            name: 'E2E Test Project',
                githubUrl: 'https://github.com/facebook/react',
                techStack: {
                    backend: 'nodejs',
                    backendVersion: '20.5.0',
                    frontend: 'react',
                    frontendVersion: '18.2.0',
                    database: 'postgresql',
                    databaseVersion: '16',
                }
        }).expect(201)
        .expect((res) => {
            expect(res.body.name).toEqual("E2E Test Project")
            expect(res.body.dockerConfig).toBeDefined();
            projectId = res.body.id
        })

        
    });

    // Token ile projeleri listeleyelim.
    it("should list all of the projects finally a sending request with token.", () => {
        return request(app.getHttpServer()).get("/projects")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty("name");
        });
    });

    // Token ile tek bir projeyi getir.
    // CreateProject e bağımlı
    it("should return a single project by id", () => {
        return request(app.getHttpServer()).get(`/projects/${projectId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
            expect(res.body.id).toEqual(projectId)
            expect(res.body).toHaveProperty("name");
        });
    });

    // Token olmadan yapılan istekler reddedilmeli.
    it("should reject the project creation without token", () => {
        return request(app.getHttpServer()).post("/projects").send({
            name: "test", 
            githubUrl: 'https://github.com/user/repo',
            techStack: {}
        }).expect(401);
    });

    // Başka kullanıcının projesine erişim reddeilmeli.
    describe('Ownership checks', () => {
        let otherUserToken: string;
        let myProjectId: string;

        beforeAll(async () => {
            // İkinci kullanıcıyı oluştur
            await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'other-user@depli.com', password: 'securePass123' });

            const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'other-user@depli.com', password: 'securePass123' });

            otherUserToken = loginRes.body.accessToken;

            // İlk kullanıcı (authToken) ile bir proje oluştur
            const createRes = await request(app.getHttpServer())
            .post('/projects')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'My Private Project',
                githubUrl: 'https://github.com/facebook/react',
                techStack: { backend: 'nodejs', backendVersion: '20.5.0', frontend: 'react', frontendVersion: '18.2.0', database: 'postgresql', databaseVersion: '16' }
            });

            myProjectId = createRes.body.id;
        });

        it('should reject access to another users project', () => {
            return request(app.getHttpServer())
            .get(`/projects/${myProjectId}`)
            .set('Authorization', `Bearer ${otherUserToken}`) // ← başka kullanıcının token'ı
            .expect(403);
        });

        it('should reject deletion of another users project', () => {
            return request(app.getHttpServer())
            .delete(`/projects/${myProjectId}`)
            .set('Authorization', `Bearer ${otherUserToken}`)
            .expect(403);
        });
    });
    describe('DELETE /projects/:id', () => {
        let projectToDeleteId: string;

        beforeEach(async () => {
            const res = await request(app.getHttpServer())
            .post('/projects')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                name: 'Project to Delete',
                githubUrl: 'https://github.com/facebook/react',
                techStack: {
                backend: 'nodejs',
                backendVersion: '20.5.0',
                frontend: 'react',
                frontendVersion: '18.2.0',
                database: 'postgresql',
                databaseVersion: '16'
                }
            });
            projectToDeleteId = res.body.id;
        });

        it('should delete own project successfully', async () => {
            await request(app.getHttpServer())
            .delete(`/projects/${projectToDeleteId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

            // Silindiğini doğrula — artık bulunamamalı
            await request(app.getHttpServer())
            .get(`/projects/${projectToDeleteId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(404);
        });

        it('should reject deletion without token', () => {
            return request(app.getHttpServer())
            .delete(`/projects/${projectToDeleteId}`)
            .expect(401);
        });
    });


});