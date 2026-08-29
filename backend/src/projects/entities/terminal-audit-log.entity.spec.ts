import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { TerminalAuditLogEntity } from './terminal-audit-log.entity';

describe('TerminalAuditLog Entity (Integration)', () => {
    let container: StartedPostgreSqlContainer;
    let dataSource: DataSource;

    beforeAll(async () => {
        container = await new PostgreSqlContainer('postgres:16-alpine').start();

        dataSource = new DataSource({
            type: 'postgres',
            host: container.getHost(),
                                    port: container.getPort(),
                                    username: container.getUsername(),
                                    password: container.getPassword(),
                                    database: container.getDatabase(),
                                    entities: [TerminalAuditLogEntity],
                                    synchronize: true,
        });

        await dataSource.initialize();
    }, 30000);

    afterAll(async () => {
        await dataSource.destroy();
        await container.stop();
    });

    beforeEach(async () => {
        await dataSource.getRepository(TerminalAuditLogEntity).createQueryBuilder().delete().execute();
    });

    it('should create terminal_audit_logs table with correct columns and types', async () => {
        const queryRunner = dataSource.createQueryRunner();
        const table = await queryRunner.getTable('terminal_audit_logs');

        expect(table).toBeDefined();
        expect(table?.findColumnByName('id')?.type).toBe('uuid');
        expect(table?.findColumnByName('projectId')?.type).toBe('uuid');
        expect(table?.findColumnByName('userId')?.type).toBe('uuid');
        expect(table?.findColumnByName('command')?.type).toBe('text');
        expect(table?.findColumnByName('createdAt')?.type).toBe('timestamp with time zone');

        await queryRunner.release();
    });

    it('should save a command entry successfully', async () => {
        const repo = dataSource.getRepository(TerminalAuditLogEntity);

        const entry = repo.create({
            projectId: 'a1b2c3d4-e5f6-47a8-9b3c-1d2e3f4a5b6c',
            userId: 'b2c3d4e5-f6a7-48b9-0c4d-2e3f4a5b6c7d',
            command: 'ls -la\n',
        });

        const saved = await repo.save(entry);

        expect(saved.id).toBeDefined();
        expect(saved.command).toBe('ls -la\n');
        expect(saved.createdAt).toBeDefined();
    });

    it('should retrieve commands filtered by projectId', async () => {
        const repo = dataSource.getRepository(TerminalAuditLogEntity);
        const projectId = 'a1b2c3d4-e5f6-47a8-9b3c-1d2e3f4a5b6c';
        const testUserId = 'c3d4e5f6-a7b8-49c0-1d5e-3f4a5b6c7d8e';

    await repo.save([
        repo.create({ projectId, userId: testUserId, command: 'ls\n' }),
                    repo.create({ projectId, userId: testUserId, command: 'pwd\n' }),
                    repo.create({ projectId: 'd4e5f6a7-b8c9-4a0d-2e6f-4a5b6c7d8e9f', userId: testUserId, command: 'whoami\n' }),
    ]);

    const results = await repo.find({ where: { projectId } });

    expect(results).toHaveLength(2);
    });
});
