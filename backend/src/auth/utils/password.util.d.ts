export declare function hashPassword(plainPassword: string): Promise<string>;
export declare function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
