export declare class GithubIntegrationService {
    isValidGithubUrl(url: string): boolean;
    private parseGithubUrl;
    isRepoAccessible(url: string, token?: string): Promise<boolean>;
}
