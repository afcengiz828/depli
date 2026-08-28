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
import { TerminalService } from '../services/terminal.service';

@Injectable()
@WebSocketGateway({ namespace: 'terminal', cors: true })
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private readonly wsAuthService: WsAuthService,
            private readonly terminalService: TerminalService,
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
        if (client.data.stopTerminal) {
            client.data.stopTerminal();
        }
    }

    @SubscribeMessage('subscribe')
    async handleSubscribe(
        @ConnectedSocket() client: Socket,
                          @MessageBody() data: { projectId: string; serviceName: string },
    ) {
        try {
            const { write, stop } = await this.terminalService.startTerminal(
                data.projectId,
                client.data.userId,
                data.serviceName,
                (chunk: string) => {
                    client.emit('output', chunk);
                },
            );

            client.data.terminalWrite = write;
            client.data.stopTerminal = stop;
        } catch (error) {
            client.emit('error', { message: error.message || 'Failed to start terminal session' });
        }
    }

    @SubscribeMessage('input')
    handleInput(
        @ConnectedSocket() client: Socket,
                @MessageBody() data: { data: string },
    ) {
        if (client.data.terminalWrite) {
            client.data.terminalWrite(data.data);
        }
    }
}
