import { execFile } from 'child_process';
import { GitCloneService } from './git-clone.service';

jest.mock('child_process');

describe('GitCloneService', () => {
    let service: GitCloneService;
    const githubUrl = 'https://github.com/facebook/react';
    const targetDir = '/tmp/depli-test-workspace/project-uuid/repo';

beforeEach(() => {
    service = new GitCloneService();
    jest.clearAllMocks();
});

const mockSuccess = () => {
    (execFile as unknown as jest.Mock).mockImplementation(
        (_file, _args, callback) => {
            callback(null, { stdout: 'Cloning into...\n', stderr: '' });
        },
    );
};

const mockFailure = (stderr: string = 'repository not found') => {
    (execFile as unknown as jest.Mock).mockImplementation(
        (_file, _args, callback) => {
            const error: any = new Error(stderr);
            error.stderr = stderr;
            callback(error);
        },
    );
};

it('should call execFile with git clone and correct arguments for public repo', async () => {
    mockSuccess();

    await service.cloneRepository(githubUrl, targetDir);

    expect(execFile).toHaveBeenCalledWith(
        'git',
        ['clone', githubUrl, targetDir],
        expect.any(Function),
    );
});

it('should inject token into URL for private repo', async () => {
    mockSuccess();

    await service.cloneRepository(githubUrl, targetDir, 'my-secret-token');

    expect(execFile).toHaveBeenCalledWith(
        'git',
        ['clone', 'https://my-secret-token@github.com/facebook/react', targetDir],
        expect.any(Function),
    );
});

it('should not throw when clone succeeds', async () => {
    mockSuccess();

    await expect(service.cloneRepository(githubUrl, targetDir)).resolves.not.toThrow();
});

it('should throw an error when clone fails', async () => {
    mockFailure('repository not found');

    await expect(service.cloneRepository(githubUrl, targetDir)).rejects.toThrow();
});

it('should not expose the token in the thrown error message', async () => {
    mockFailure('fatal: could not read Username');

    try {
        await service.cloneRepository(githubUrl, targetDir, 'my-secret-token');
    } catch (error: any) {
        expect(error.message).not.toContain('my-secret-token');
    }
});
});
