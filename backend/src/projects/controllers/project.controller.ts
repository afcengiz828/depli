import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from '../services/project.service';
import { CreateProjectDto } from '../dto/create-project.dto';

@Controller("projects") 
@UseGuards(AuthGuard('jwt'))
export class ProjectController {
    constructor(private readonly projectService: ProjectService) {}

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

}