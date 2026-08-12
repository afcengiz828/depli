import { GithubIntegrationService } from './github-integration.service';
import nock from 'nock';

describe('GithubIntegrationService', () => {
  let service: GithubIntegrationService;

  beforeEach(() => {
    service = new GithubIntegrationService();
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service.isValidGithubUrl).toBeDefined();
    expect(service.isRepoAccessible).toBeDefined();
  });

  describe('isValidGithubUrl', () => {
    it('should return true for valid github url', () => {
      expect(service.isValidGithubUrl('https://github.com/facebook/react')).toBe(true);
    });

    it('should return false for gitlab url', () => {
      expect(service.isValidGithubUrl('https://gitlab.com/user/repo')).toBe(false);
    });

    it('should return false for invalid url', () => {
      expect(service.isValidGithubUrl('not-a-url')).toBe(false);
    });

    it('should return false for url without repo name', () => {
      expect(service.isValidGithubUrl('https://github.com/user')).toBe(false);
    });
  });

  describe('isRepoAccessible', () => {
    it('should return true for accessible public repo', async () => {
      nock('https://api.github.com')
        .get('/repos/facebook/react')
        .reply(200, { full_name: 'facebook/react' });

      const result = await service.isRepoAccessible('https://github.com/facebook/react');
      expect(result).toBe(true);
    });

    it('should return false for non-existent repo', async () => {
      nock('https://api.github.com')
        .get('/repos/user/nonexistent-repo')
        .reply(404);

      const result = await service.isRepoAccessible('https://github.com/user/nonexistent-repo');
      expect(result).toBe(false);
    });

    it('should send Authorization header when token is provided', async () => {
      nock('https://api.github.com', {
        reqheaders: { authorization: 'token valid-token' }
      })
        .get('/repos/facebook/react')
        .reply(200, { full_name: 'facebook/react' });

      const result = await service.isRepoAccessible(
        'https://github.com/facebook/react',
        'valid-token'
      );
      expect(result).toBe(true);
    });

    it('should return false when accessing private repo without token', async () => {
        nock('https://api.github.com')
            .get('/repos/user/private-repo')
            .reply(401); // Unauthorized

        const result = await service.isRepoAccessible('https://github.com/user/private-repo');
        expect(result).toBe(false);
    });
  });
});