"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubIntegrationService = void 0;
const rest_1 = require("@octokit/rest");
class GithubIntegrationService {
    isValidGithubUrl(url) {
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
    parseGithubUrl(url) {
        try {
            const Url = new URL(url);
            return {
                owner: Url.pathname.split('/')[1],
                repo: Url.pathname.split('/')[2]
            };
        }
        catch {
            return null;
        }
    }
    async isRepoAccessible(url, token) {
        const parsed = this.parseGithubUrl(url);
        if (!parsed) {
            return Promise.resolve(false);
        }
        const octokit = new rest_1.Octokit({ auth: token });
        try {
            await octokit.repos.get({ owner: parsed.owner, repo: parsed.repo });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.GithubIntegrationService = GithubIntegrationService;
//# sourceMappingURL=github-integration.service.js.map