import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthService {

    constructor(
        private readonly jwtService: JwtService
    )
    {}

    authenticateSocket(client: Socket) {
        const token = client.handshake?.auth?.token;

        if(!token){
            throw new UnauthorizedException("No token provided");
        }

        try {
            const payload = this.jwtService.verify(token);
            if(!(payload.sub)){
                throw new UnauthorizedException("Invalid token payload");
            }

            return {userId: payload.sub};
        } catch (e) {
            throw new UnauthorizedException();
        }



    }
}
