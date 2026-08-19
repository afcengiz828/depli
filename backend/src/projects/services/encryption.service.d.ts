export declare class EncryptionService {
    private readonly algorithm;
    private readonly keyLength;
    private readonly ivLength;
    private get key();
    encrypt(text: string): string;
    decrypt(encryptedText: string): string;
}
