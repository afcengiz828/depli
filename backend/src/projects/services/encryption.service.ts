import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly keyLength = 32;
  private readonly ivLength = 16;

  // Çevre değişkeninden gelen anahtarı alıp 32 byte olmasını garanti ediyoruz
  private get key(): Buffer {
    const secret = process.env.ENCRYPTION_KEY || 'default-dev-secret-key-1234567890';
    return Buffer.from(secret.padEnd(this.keyLength, '0').slice(0, this.keyLength));
  }

  encrypt(text: string): string {
    // Rastgele 16 bytelık bir IV oluşturuyoruz
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Şifreyi çözerken IV'ye ihtiyacımız olacağı için onu da stringe ekleyip dönüyoruz
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    
    if (!ivHex || !encrypted) {
      throw new Error('Invalid encryption format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}