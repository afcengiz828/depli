declare class TechStackDto {
    backend: string;
    backendVersion: string;
    frontend: string;
    frontendVersion: string;
    database: string;
    databaseVersion: string;
}
export declare class CreateProjectDto {
    name: string;
    githubUrl: string;
    techStack: TechStackDto;
    githubToken?: string;
    presetName?: string;
}
export {};
