import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from '../services/project.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { SetEnvVariablesDto } from '../dto/set-env-variables.dto';
import { EnvVariableService } from "../services/env-variable.service";

@Controller("projects") 
@UseGuards(AuthGuard('jwt'))
export class ProjectController {
    constructor(private readonly projectService: ProjectService,
        private readonly envVariableService: EnvVariableService
    ) {}


    @Post()
    async create (@Body() dto: CreateProjectDto, @Req() req) {
        return this.projectService.createProject(dto, req.user.userId);
    }

    @Get()
    async findAll (@Req() req) {
        return this.projectService.getUserProjects(req.user.userId);
    }  

    @Get(":id")
    async find (@Param("id") id: string, @Req() req) {
        return this.projectService.getProject(id, req.user.userId);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req) {
        await this.projectService.deleteProject(id, req.user.userId);
        return { message: 'Project deleted successfully' };
    }

    @Put(':id/env')
    async setEnv(@Param('id') id: string, @Body() dto: SetEnvVariablesDto, @Req() req) {
        await this.envVariableService.setEnvVariables(id, req.user.userId, dto.variables);
        return { message: 'Environment variables updated successfully' };
    }

    @Get(':id/env')
    async getEnv(@Param('id') id: string, @Req() req) {
        const keys = await this.envVariableService.getEnvVariableKeys(id, req.user.userId);
        return { keys };
    }

}
