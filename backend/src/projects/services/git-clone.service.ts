import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

@Injectable()
export class GitCloneService {
    async cloneRepository(githubUrl: string, targetDir: string, token?: string): Promise<void> {
        const cloneUrl = this.buildCloneUrl(githubUrl, token);

        try {
            await execFileAsync('git', ['clone', cloneUrl, targetDir]);
        } catch (error: any) {
            const sanitizedMessage = this.sanitizeErrorMessage(error.stderr || error.message, token);
            throw new Error(`Failed to clone repository: ${sanitizedMessage}`);
        }
    }

    private buildCloneUrl(githubUrl: string, token?: string): string {
        if (!token) {
            return githubUrl;
        }

        const url = new URL(githubUrl);
        return `${url.protocol}//${token}@${url.host}${url.pathname}`;
    }

    private sanitizeErrorMessage(message: string, token?: string): string {
        if (!token) {
            return message;
        }
        return message.split(token).join('***');
    }
}
