import { Injectable } from '@nestjs/common';
import { DockerCliService } from './docker-cli.service';

@Injectable()
export class HealthcheckService {
    constructor(private readonly dockerCliService: DockerCliService) {}

    async waitUntilHealthy(
        composeFilePath: string,
        timeoutMs: number = 45000,
        pollIntervalMs: number = 1000,
    ): Promise<boolean> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const { services } = await this.dockerCliService.ps(composeFilePath);

            if (services.length > 0 && services.every((s) => s.state === 'running')) {
                return true;
            }

            await this.delay(pollIntervalMs);
        }

        return false;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
