// Database connection test using Testcontainers and TypeORM
import { DataSource } from 'typeorm';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

describe('Database Connection', () => {
  // Declare variables for the PostgreSQL container and TypeORM DataSource
  let container: StartedPostgreSqlContainer;
  let dataSource: DataSource;

  // Set up the PostgreSQL container and initialize the TypeORM DataSource before all tests
  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16').start();

    dataSource = new DataSource({
      type: 'postgres',
      host: container.getHost(),
      port: container.getPort(),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
    });

    await dataSource.initialize();
  }, 30000);
  
  // Clean up the PostgreSQL container and destroy the TypeORM DataSource after all tests
  afterAll(async () => {
    await dataSource.destroy();
    await container.stop();
  });

  // Test case to check if the database connection is successfully established
  it('should successfully connect to postgres', () => {
    expect(dataSource.isInitialized).toBe(true);
  });
});