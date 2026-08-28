import { execFile } from 'child_process';
import { DockerCliService } from './docker-cli.service';
import { spawn } from 'child_process';


jest.mock('child_process');

describe('DockerCliService', () => {
    let service: DockerCliService;
    const composeFilePath = '/tmp/depli-test-workspace/test-project/docker-compose.yml';

beforeEach(() => {
    service = new DockerCliService();
    jest.clearAllMocks();
});

const mockSuccess = (stdout: string = 'mocked stdout output') => {
    (execFile as unknown as jest.Mock).mockImplementation(
        (_file, _args, callback) => {
            callback(null, { stdout, stderr: '' });  // ← tek obje olarak
        },
    );
};

const mockFailure = (stderr: string = 'docker: command failed') => {
    (execFile as unknown as jest.Mock).mockImplementation(
        (_file, _args, callback) => {
            const error: any = new Error(stderr);
            error.stderr = stderr;
            callback(error);
        },
    );
};

describe('up', () => {
    it('should call execFile with correct docker compose up arguments', async () => {
        mockSuccess();

        await service.up(composeFilePath);

        expect(execFile).toHaveBeenCalledWith(
            'docker',
            ['compose', '-f', composeFilePath, 'up', '-d'],
            expect.any(Function),
        );
    });

    it('should return success true when command succeeds', async () => {
        mockSuccess('containers started');

        const result = await service.up(composeFilePath);

        expect(result.success).toBe(true);
        expect(result.output).toBe('containers started');
    });

    it('should return success false when command fails', async () => {
        mockFailure('port already in use');

        const result = await service.up(composeFilePath);

        expect(result.success).toBe(false);
        expect(result.output).toContain('port already in use');
    });
});

describe('down', () => {
    it('should call execFile with correct docker compose down arguments', async () => {
        mockSuccess();

        await service.down(composeFilePath);

        expect(execFile).toHaveBeenCalledWith(
            'docker',
            ['compose', '-f', composeFilePath, 'down'],
            expect.any(Function),
        );
    });

    it('should return success true when command succeeds', async () => {
        mockSuccess('containers removed');

        const result = await service.down(composeFilePath);

        expect(result.success).toBe(true);
    });

    it('should return success false when command fails', async () => {
        mockFailure('no such file');

        const result = await service.down(composeFilePath);

        expect(result.success).toBe(false);
    });
});

describe('stop', () => {
    it('should call execFile with correct docker compose stop arguments', async () => {
        mockSuccess();

        await service.stop(composeFilePath);

        expect(execFile).toHaveBeenCalledWith(
            'docker',
            ['compose', '-f', composeFilePath, 'stop'],
            expect.any(Function),
        );
    });

    it('should return success true when command succeeds', async () => {
        mockSuccess('containers stopped');

        const result = await service.stop(composeFilePath);

        expect(result.success).toBe(true);
    });

    it('should return success false when command fails', async () => {
        mockFailure('container not found');

        const result = await service.stop(composeFilePath);

        expect(result.success).toBe(false);
    });
});

describe('start', () => {
    it('should call execFile with correct docker compose start arguments', async () => {
        mockSuccess();

        await service.start(composeFilePath);

        expect(execFile).toHaveBeenCalledWith(
            'docker',
            ['compose', '-f', composeFilePath, 'start'],
            expect.any(Function),
        );
    });

    it('should return success true when command succeeds', async () => {
        mockSuccess('containers started');

        const result = await service.start(composeFilePath);

        expect(result.success).toBe(true);
    });

    it('should return success false when command fails', async () => {
        mockFailure('container not found');

        const result = await service.start(composeFilePath);

        expect(result.success).toBe(false);
    });
});

describe('ps', () => {
    it('should call execFile with correct ps arguments including json format', async () => {
        mockSuccess('');

        await service.ps(composeFilePath);

        expect(execFile).toHaveBeenCalledWith(
            'docker',
            ['compose', '-f', composeFilePath, 'ps', '--format', 'json'],
            expect.any(Function),
        );
    });

    it('should parse JSON lines output into service status array', async () => {
        const line1 = JSON.stringify({ Name: 'backend', State: 'running' });
        const line2 = JSON.stringify({ Name: 'database', State: 'running' });
        mockSuccess(`${line1}\n${line2}`);

        const result = await service.ps(composeFilePath);

        expect(result.services).toEqual([
            { name: 'backend', state: 'running' },
            { name: 'database', state: 'running' },
        ]);
    });

    it('should return empty services array when output is empty', async () => {
        mockSuccess('');

        const result = await service.ps(composeFilePath);

        expect(result.services).toEqual([]);
    });

    it('should return empty services array when command fails', async () => {
        mockFailure('no such service');

        const result = await service.ps(composeFilePath);

        expect(result.services).toEqual([]);
    });
});

describe('streamLogs', () => {
    let mockChildProcess: any;

    beforeEach(() => {
        mockChildProcess = {
            stdout: { on: jest.fn() },
               stderr: { on: jest.fn() },
               kill: jest.fn(),
        };

        (spawn as unknown as jest.Mock).mockReturnValue(mockChildProcess);
    });

    it('should call spawn with correct docker compose logs arguments', () => {
        const onData = jest.fn();

        service.streamLogs(composeFilePath, onData);

        expect(spawn).toHaveBeenCalledWith('docker', [
            'compose',
            '-f',
            composeFilePath,
            'logs',
            '-f',
            '--no-color',
        ]);
    });

    it('should invoke onData callback when stdout emits data', () => {
        const onData = jest.fn();

        service.streamLogs(composeFilePath, onData);

        const stdoutDataHandler = mockChildProcess.stdout.on.mock.calls.find(
            (call: any[]) => call[0] === 'data',
        )[1];

        stdoutDataHandler(Buffer.from('backend | Server started on port 3000\n'));

        expect(onData).toHaveBeenCalledWith('backend | Server started on port 3000\n');
    });

    it('should invoke onData callback when stderr emits data', () => {
        const onData = jest.fn();

        service.streamLogs(composeFilePath, onData);

        const stderrDataHandler = mockChildProcess.stderr.on.mock.calls.find(
            (call: any[]) => call[0] === 'data',
        )[1];

        stderrDataHandler(Buffer.from('database | connection warning\n'));

        expect(onData).toHaveBeenCalledWith('database | connection warning\n');
    });

    it('should kill the child process when stop is called', () => {
        const onData = jest.fn();

        const { stop } = service.streamLogs(composeFilePath, onData);
        stop();

        expect(mockChildProcess.kill).toHaveBeenCalled();
    });
});

describe('execInteractive', () => {
    let mockChildProcess: any;

    beforeEach(() => {
        mockChildProcess = {
            stdin: { write: jest.fn() },
               stdout: { on: jest.fn() },
               stderr: { on: jest.fn() },
               kill: jest.fn(),
        };

        (spawn as unknown as jest.Mock).mockReturnValue(mockChildProcess);
    });

    it('should call spawn with correct docker compose exec arguments', () => {
        const onData = jest.fn();

        service.execInteractive(composeFilePath, 'backend', onData);

        expect(spawn).toHaveBeenCalledWith('docker', [
            'compose',
            '-f',
            composeFilePath,
            'exec',
            '-i',
            'backend',
            '/bin/sh',
        ]);
    });

    it('should invoke onData callback when stdout emits data', () => {
        const onData = jest.fn();

        service.execInteractive(composeFilePath, 'backend', onData);

        const stdoutDataHandler = mockChildProcess.stdout.on.mock.calls.find(
            (call: any[]) => call[0] === 'data',
        )[1];

        stdoutDataHandler(Buffer.from('$ '));

        expect(onData).toHaveBeenCalledWith('$ ');
    });

    it('should invoke onData callback when stderr emits data', () => {
        const onData = jest.fn();

        service.execInteractive(composeFilePath, 'backend', onData);

        const stderrDataHandler = mockChildProcess.stderr.on.mock.calls.find(
            (call: any[]) => call[0] === 'data',
        )[1];

        stderrDataHandler(Buffer.from('sh: command not found\n'));

        expect(onData).toHaveBeenCalledWith('sh: command not found\n');
    });

    it('should write input to child process stdin when write is called', () => {
        const onData = jest.fn();

        const { write } = service.execInteractive(composeFilePath, 'backend', onData);
        write('ls -la\n');

        expect(mockChildProcess.stdin.write).toHaveBeenCalledWith('ls -la\n');
    });

    it('should kill the child process when stop is called', () => {
        const onData = jest.fn();

        const { stop } = service.execInteractive(composeFilePath, 'backend', onData);
        stop();

        expect(mockChildProcess.kill).toHaveBeenCalled();
    });
});
});
