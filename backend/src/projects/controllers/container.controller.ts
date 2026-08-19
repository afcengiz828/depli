import { Controller,  Post, Delete,  Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContainerLifecycleService } from '../services/container-lifecycle.service';

@Controller("projects")
@UseGuards(AuthGuard('jwt'))
export class ContainerController {
    constructor(private readonly containerService: ContainerLifecycleService) {}

    @Post(":id/start")
    async start (@Param("id") id: string, @Req() req) {
        return this.containerService.startContainer(id, req.user.userId);
    }

    @Post(":id/stop")
    async stop (@Param('id') id: string, @Req() req) {
        return this.containerService.stopContainer(id, req.user.userId);
    }

    @Delete(':id/container')
    async remove(@Param('id') id: string, @Req() req) {
        await this.containerService.removeContainer(id, req.user.userId);
        return { message: 'Container removed successfully' };
    }

}
