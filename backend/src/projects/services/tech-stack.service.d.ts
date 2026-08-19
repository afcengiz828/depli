export declare class TechStackService {
    isValidTechStack(combination: {
        backend: string;
        backendVersion: string;
        frontend: string;
        frontendVersion: string;
        database: string;
        databaseVersion: string;
    }): boolean;
    isValidPreset(preset: string): boolean;
}
