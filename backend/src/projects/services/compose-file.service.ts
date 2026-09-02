import { Injectable } from "@nestjs/common";
import path from "path";
import * as fs from 'fs/promises';


@Injectable()
export class ComposeFileService {
    private readonly workspaceDir: string;

    constructor () {

        const workspaceDir = process.env.DEPLI_WORKSPACE_DIR;

        if (!workspaceDir) {
            throw new Error('DEPLI_WORKSPACE_DIR environment variable is not set');
        }

        this.workspaceDir = workspaceDir;

    }

    getProjectDir (pId: string) {
        return path.join
    }

    getComposeFilePath (pId: string) : string{
        if(!pId || pId.trim() == ""){
            throw new Error("pId should not be empty");
        }

        if(pId.includes('\0')){
            throw new Error("ProjectId includes null bytes");
        }
        const resolvedWorkspace = path.resolve(this.workspaceDir);

        const filePath = path.join(this.workspaceDir, pId);
        let resolved = path.resolve(filePath);

        if(!resolved.startsWith(resolvedWorkspace + path.sep)){
            throw new Error("Path traversal attempts error.")
        }

        return path.join(this.workspaceDir, pId, "docker-compose.yml");
    }

    async writeComposeFile (pId: string, ymlContent: string) {
        const filePath = path.dirname(this.getComposeFilePath(pId));
        const Path = path.join(filePath, "docker-compose.yml")
        await fs.mkdir(filePath, {recursive: true});
        await fs.writeFile(Path, ymlContent);
        return Path;
    }

    async composeFileExists (pId: string) {
        const filePath = this.getComposeFilePath(pId);
        try {
            await fs.access(filePath);
            return true;

        } catch {
            return false;
        }

    }

    async deleteProjectDir (pId: string) {
        const filePath = this.getComposeFilePath(pId);
        const dirName = path.dirname(filePath);
        await fs.rm(dirName, {recursive:true, force:true});
    }

    getRepoPath(projectId: string): string {
        const composeFilePath = this.getComposeFilePath(projectId);
        const projectDir = path.dirname(composeFilePath);
        return path.join(projectDir, 'repo');
    }
}
