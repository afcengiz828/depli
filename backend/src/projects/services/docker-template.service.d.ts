export declare class DockerTemplateService {
    private techStackService;
    constructor();
    generateDockerComposeYml(techStack: any): string;
    generateDockerComposeYmlFromPreset(presetName: string): string;
    private validateTechStack;
    private buildImageName;
    private buildDatabaseConfig;
    private getBackendPort;
    private getBackendPortValue;
}
