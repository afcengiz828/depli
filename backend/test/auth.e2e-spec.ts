import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { User } from '../src/users/entities/user.entity';
import { ProjectEntity } from '../src/projects/entities/project.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16').start();

    process.env.JWT_SECRET = 'e2e-test-secret';

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
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  }, 60000);

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'e2e@depli.com', password: 'securePass123' })
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toEqual('e2e@depli.com');
          expect(res.body.password).toBeUndefined();
        });
    });

    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'securePass123' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with correct credentials and return a token', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'login-test@depli.com', password: 'securePass123' });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login-test@depli.com', password: 'securePass123' })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
        });
    });

    it('should reject login with wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'wrongpass@depli.com', password: 'securePass123' });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrongpass@depli.com', password: 'incorrectPass' })
        .expect(401);
    });
  });
});