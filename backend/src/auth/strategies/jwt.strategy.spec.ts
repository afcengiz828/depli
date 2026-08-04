import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    strategy = new JwtStrategy();
  });

  it('should return user payload from a valid token', async () => {
    const payload = { sub: 'uuid-1234', email: 'test@depli.com' };

    const result = await strategy.validate(payload);

    expect(result).toEqual({ userId: 'uuid-1234', email: 'test@depli.com' });
  });
});