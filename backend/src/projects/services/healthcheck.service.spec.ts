import { Test, TestingModule } from '@nestjs/testing';
import { HealthcheckService } from './healthcheck.service';
import { DockerCliService } from './docker-cli.service';

describe('HealthcheckService', () => {
    let service: HealthcheckService;
    let mockDockerCliService: any;

    const composeFilePath = '/tmp/depli-test-workspace/test-project/docker-compose.yml';

beforeEach(async () => {
    jest.useFakeTimers();

    mockDockerCliService = {
        ps: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            HealthcheckService,
            { provide: DockerCliService, useValue: mockDockerCliService },
        ],
    }).compile();

    service = module.get<HealthcheckService>(HealthcheckService);
});

afterEach(() => {
    jest.useRealTimers();
});

it('should return true immediately if all services are running on first check', async () => {
    mockDockerCliService.ps.mockResolvedValue({
        services: [
            { name: 'backend', state: 'running' },
            { name: 'database', state: 'running' },
        ],
    });

    const resultPromise = service.waitUntilHealthy(composeFilePath, 45000, 1000);
    const result = await resultPromise;

    expect(result).toBe(true);
    expect(mockDockerCliService.ps).toHaveBeenCalledTimes(1);
});

it('should poll multiple times until all services become healthy', async () => {
    mockDockerCliService.ps
    .mockResolvedValueOnce({
        services: [
            { name: 'backend', state: 'starting' },
            { name: 'database', state: 'running' },
        ],
    })
    .mockResolvedValueOnce({
        services: [
            { name: 'backend', state: 'starting' },
            { name: 'database', state: 'running' },
        ],
    })
    .mockResolvedValueOnce({
        services: [
            { name: 'backend', state: 'running' },
            { name: 'database', state: 'running' },
        ],
    });

    const resultPromise = service.waitUntilHealthy(composeFilePath, 45000, 1000);

    // İlk kontrol zaten çalışır, sonra iki kez daha polling yapması için zamanı ilerletiyoruz
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(1000);

    const result = await resultPromise;

    expect(result).toBe(true);
    expect(mockDockerCliService.ps).toHaveBeenCalledTimes(3);
});

it('should return false when timeout is exceeded', async () => {
    mockDockerCliService.ps.mockResolvedValue({
        services: [
            { name: 'backend', state: 'starting' },
            { name: 'database', state: 'starting' },
        ],
    });

    const resultPromise = service.waitUntilHealthy(composeFilePath, 5000, 1000);

    // Timeout süresini aşacak kadar zamanı ilerlet
    await jest.advanceTimersByTimeAsync(6000);

    const result = await resultPromise;

    expect(result).toBe(false);
});

it('should treat empty services array as not healthy', async () => {
    mockDockerCliService.ps.mockResolvedValue({ services: [] });

    const resultPromise = service.waitUntilHealthy(composeFilePath, 3000, 1000);

    await jest.advanceTimersByTimeAsync(4000);

    const result = await resultPromise;

    expect(result).toBe(false);
});
});
