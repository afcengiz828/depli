import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
export declare class AuthService {
    private readonly userRepository;
    private readonly jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    register(email: string, plainPassword: string): Promise<User>;
    login(email: string, plainPassword: string): Promise<{
        accessToken: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<void>;
}
