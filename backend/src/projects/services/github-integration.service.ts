import { Octokit } from '@octokit/rest';


export class GithubIntegrationService {

    isValidGithubUrl(url: string): boolean {   
        // URL isteği at ve status kodunu kontrol et
        // Bu kısımda gerçek bir HTTP isteği yapılabilir, ancak testlerde nock ile mocklanacak
        try {
            const Url = new URL(url);
            if (Url.hostname !== 'github.com') {
                return false;
            }
            const parts = Url.pathname.split('/').filter(Boolean);
            if (parts.length < 2) {
                return false;
            }
        }
       catch {
            return false;
        }
        return true;
    }

    private parseGithubUrl(url: string): { owner: string; repo: string } | null {
        try {
            const Url = new URL(url);
            return {
                owner: Url.pathname.split('/')[1],
                repo: Url.pathname.split('/')[2]
            };
        } catch {
            return null;
        }
    }

    async isRepoAccessible(url: string, token?: string): Promise<boolean> {
        const parsed = this.parseGithubUrl(url);
        if (!parsed) {
            return Promise.resolve(false);
        }

        const octokit = new Octokit({ auth: token });
  
        try {
            await octokit.repos.get({ owner: parsed.owner, repo: parsed.repo });
            return true;
        } catch {
            return false;
        }
    }
}