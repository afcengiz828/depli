import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsAuthService } from '../guards/ws-auth.service';
import { LogStreamService } from '../services/log-stream.service';

@Injectable()
@WebSocketGateway({ namespace: 'logs', cors: true })
export class LogStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly wsAuthService: WsAuthService,
            private readonly logStreamService: LogStreamService,
    ) {}

    handleConnection(client: Socket) {
        try {
            const { userId } = this.wsAuthService.authenticateSocket(client);
            client.data.userId = userId;
        } catch (error) {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        if (client.data.stopStreaming) {
            client.data.stopStreaming();
        }
    }

    @SubscribeMessage('subscribe')
    async handleSubscribe(
        @ConnectedSocket() client: Socket,
                          @MessageBody() data: { projectId: string },
    ) {
        try {
            const { stop } = await this.logStreamService.startStreaming(
                data.projectId,
                client.data.userId,
                (chunk: string) => {
                    client.emit('log', chunk);
                },
            );

            client.data.stopStreaming = stop;
        } catch (error) {
            client.emit('error', { message: error.message || 'Failed to start log streaming' });
        }
    }
}
