import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    // Çevre değişkenini test ortamı için mock'luyoruz
    process.env.ENCRYPTION_KEY = 'test-icin-cok-gizli-bir-anahtar-32';
    service = new EncryptionService();
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encrypt a plain text', () => {
    const plainText = 'my-github-secret-token';
    const encryptedText = service.encrypt(plainText);

    expect(encryptedText).toBeDefined();
    expect(encryptedText).not.toEqual(plainText);
    expect(encryptedText.includes(':')).toBe(true); // IV ve şifreli metin ":" ile ayrılmalı
  });

  it('should decrypt an encrypted text back to original', () => {
    const plainText = 'my-github-secret-token';
    const encryptedText = service.encrypt(plainText);
    const decryptedText = service.decrypt(encryptedText);

    expect(decryptedText).toEqual(plainText);
  });

  it('should throw error on invalid encrypted text format', () => {
    expect(() => service.decrypt('invalid-format-without-colon')).toThrow();
  });

  it('should produce different encrypted text for same input', () => {
    const plainText = 'my-github-secret-token';
    const encrypted1 = service.encrypt(plainText);
    const encrypted2 = service.encrypt(plainText);
    expect(encrypted1).not.toEqual(encrypted2);
  });
});