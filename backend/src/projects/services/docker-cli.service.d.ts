interface CommandResult {
    success: boolean;
    output: string;
}
interface ServiceStatus {
    name: string;
    state: string;
}
export declare class DockerCliService {
    up(composeFilePath: string): Promise<CommandResult>;
    down(composeFilePath: string): Promise<CommandResult>;
    stop(composeFilePath: string): Promise<CommandResult>;
    start(composeFilePath: string): Promise<CommandResult>;
    ps(composeFilePath: string): Promise<{
        services: ServiceStatus[];
    }>;
    private runCommand;
}
export {};
