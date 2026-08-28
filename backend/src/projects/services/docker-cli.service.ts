import { Injectable } from '@nestjs/common';
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);

interface CommandResult {
    success: boolean;
    output: string;
}

interface ServiceStatus {
    name: string;
    state: string;
}

@Injectable()
export class DockerCliService {

    async up(composeFilePath: string): Promise<CommandResult> {
        // execFile('docker', ['compose', '-f', composeFilePath, 'up', '-d'], ...)
        return this.runCommand(["compose", "-f", composeFilePath, "up", "-d"])
    }

    async down(composeFilePath: string): Promise<CommandResult> {
        return this.runCommand(["compose", "-f", composeFilePath, "down"])
    }

    async stop(composeFilePath: string): Promise<CommandResult> {
        return this.runCommand(["compose", "-f", composeFilePath, "stop"])
    }

    async start(composeFilePath: string): Promise<CommandResult> {
        return this.runCommand(["compose", "-f", composeFilePath, "start"])
    }

    async ps(composeFilePath: string): Promise<{ services: ServiceStatus[] }> {
        const result = await this.runCommand(["compose", "-f", composeFilePath, "ps", "--format", "json"])
        // çıktıyı parse edip { services: [...] } formatına çevir
        if(!result.success){
            return {services : []};
        }

        if (!result.output.trim()) {
            return { services: [] };
        }

        const lines = result.output.trim().split('\n');
        const services = lines.map(line => {
            const parsed = JSON.parse(line);
            return { name: parsed.Name, state: parsed.State };
        });

        return {services}
    }

    streamLogs(
        composeFilePath: string,
        onData: (chunk: string) => void,
    ): { stop: () => void } {
        const child = spawn('docker', [
            'compose',
            '-f',
            composeFilePath,
            'logs',
            '-f',
            '--no-color',
        ]);

        child.stdout.on('data', (chunk: Buffer) => {
            onData(chunk.toString());
        });

        child.stderr.on('data', (chunk: Buffer) => {
            onData(chunk.toString());
        });

        return {
            stop: () => {
                child.kill();
            },
        };
    }

    private async runCommand(args: string[]): Promise<CommandResult> {
        // execFile'ı Promise'e saran ortak yardımcı metod
        // her komut metodunun (up/down/stop/start) bu yardımcıyı kullanması önerilir
        try {
            const {stdout} = await execFileAsync("docker", args);
            return {success: true, output:stdout};
        }catch (error: any){
            return {success: false, output: error.stderr || error.message}
        }

    }
}
