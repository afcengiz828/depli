import { DataSource } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { User } from './user.entity';

describe('User Entity', () => {
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16').start();

    dataSource = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
      entities: [User],
      synchronize: true,
    });

    await dataSource.initialize();
  }, 30000);

  afterAll(async () => {
    await dataSource.destroy();
    await container.stop();
  });

  it('should create the users table', async () => {
    const result = await dataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_name = 'users'`,
    );
    expect(result.length).toBe(1);
  });

  it('should have the correct columns', async () => {
    const columns = await dataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`,
    );
    const columnNames = columns.map((c: { column_name: string }) => c.column_name);

    expect(columnNames).toEqual(
      expect.arrayContaining(['id', 'email', 'password', 'createdAt']),
    );
  });

  it('should enforce unique email constraint', async () => {
    const userRepo = dataSource.getRepository(User);

    await userRepo.save({ email: 'test@depli.com', password: 'hashed123' });

    await expect(
      userRepo.save({ email: 'test@depli.com', password: 'hashed456' }),
    ).rejects.toThrow();
  });
});