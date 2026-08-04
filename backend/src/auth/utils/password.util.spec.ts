import { hashPassword, verifyPassword } from './password.util';

describe('Password Util', () => {
  it('should hash a password so it does not match the plain text', async () => {
    const hash = await hashPassword('mySecret123');
    expect(hash).not.toEqual('mySecret123');
  });

  it('should produce a different hash for the same password each time', async () => {
    const hash1 = await hashPassword('mySecret123');
    const hash2 = await hashPassword('mySecret123');
    expect(hash1).not.toEqual(hash2);
  });

  it('should verify a correct password successfully', async () => {
    const hash = await hashPassword('mySecret123');
    const isValid = await verifyPassword('mySecret123', hash);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hash = await hashPassword('mySecret123');
    const isValid = await verifyPassword('wrongPassword', hash);
    expect(isValid).toBe(false);
  });
});