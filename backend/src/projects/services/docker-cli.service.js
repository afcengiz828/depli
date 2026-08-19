"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DockerCliService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
let DockerCliService = class DockerCliService {
    async up(composeFilePath) {
        return this.runCommand(["compose", "-f", composeFilePath, "up", "-d"]);
    }
    async down(composeFilePath) {
        return this.runCommand(["compose", "-f", composeFilePath, "down"]);
    }
    async stop(composeFilePath) {
        return this.runCommand(["compose", "-f", composeFilePath, "stop"]);
    }
    async start(composeFilePath) {
        return this.runCommand(["compose", "-f", composeFilePath, "start"]);
    }
    async ps(composeFilePath) {
        const result = await this.runCommand(["compose", "-f", composeFilePath, "ps", "--format", "json"]);
        if (!result.success) {
            return { services: [] };
        }
        if (!result.output.trim()) {
            return { services: [] };
        }
        const lines = result.output.trim().split('\n');
        const services = lines.map(line => {
            const parsed = JSON.parse(line);
            return { name: parsed.Name, state: parsed.State };
        });
        return { services };
    }
    async runCommand(args) {
        try {
            const { stdout } = await execFileAsync("docker", args);
            return { success: true, output: stdout };
        }
        catch (error) {
            return { success: false, output: error.stderr || error.message };
        }
    }
};
exports.DockerCliService = DockerCliService;
exports.DockerCliService = DockerCliService = __decorate([
    (0, common_1.Injectable)()
], DockerCliService);
//# sourceMappingURL=docker-cli.service.js.map