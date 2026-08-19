export declare class ComposeFileService {
    private readonly workspaceDir;
    constructor();
    getProjectDir(pId: string): (...paths: string[]) => string;
    getComposeFilePath(pId: string): string;
    writeComposeFile(pId: string, ymlContent: string): Promise<string>;
    composeFileExists(pId: string): Promise<boolean>;
    deleteProjectDir(pId: string): Promise<void>;
}
