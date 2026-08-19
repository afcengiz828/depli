"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposeFileService = void 0;
const common_1 = require("@nestjs/common");
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs/promises"));
let ComposeFileService = class ComposeFileService {
    workspaceDir;
    constructor() {
        const workspaceDir = process.env.DEPLI_WORKSPACE_DIR;
        if (!workspaceDir) {
            throw new Error('DEPLI_WORKSPACE_DIR environment variable is not set');
        }
        this.workspaceDir = workspaceDir;
    }
    getProjectDir(pId) {
        return path_1.default.join;
    }
    getComposeFilePath(pId) {
        if (!pId || pId.trim() == "") {
            throw new Error("pId should not be empty");
        }
        if (pId.includes('\0')) {
            throw new Error("ProjectId includes null bytes");
        }
        const resolvedWorkspace = path_1.default.resolve(this.workspaceDir);
        const filePath = path_1.default.join(this.workspaceDir, pId);
        let resolved = path_1.default.resolve(filePath);
        if (!resolved.startsWith(resolvedWorkspace + path_1.default.sep)) {
            throw new Error("Path traversal attempts error.");
        }
        return path_1.default.join(this.workspaceDir, pId, "docker-compose.yml");
    }
    async writeComposeFile(pId, ymlContent) {
        const filePath = path_1.default.dirname(this.getComposeFilePath(pId));
        const Path = path_1.default.join(filePath, "docker-compose.yml");
        await fs.mkdir(filePath, { recursive: true });
        await fs.writeFile(Path, ymlContent);
        return Path;
    }
    async composeFileExists(pId) {
        const filePath = this.getComposeFilePath(pId);
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async deleteProjectDir(pId) {
        const filePath = this.getComposeFilePath(pId);
        const dirName = path_1.default.dirname(filePath);
        await fs.rm(dirName, { recursive: true, force: true });
    }
};
exports.ComposeFileService = ComposeFileService;
exports.ComposeFileService = ComposeFileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ComposeFileService);
//# sourceMappingURL=compose-file.service.js.map