describe('jwtSecret', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  test('production rejects short JWT_SECRET', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short';
    expect(() => require('../utils/jwtSecret').getJwtSecret()).toThrow(/JWT_SECRET/);
  });

  test('production rejects placeholder JWT_SECRET', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'your_super_secret_jwt_key_here_change_in_production_xxxxx';
    expect(() => require('../utils/jwtSecret').getJwtSecret()).toThrow(/placeholder/);
  });

  test('development accepts long secret', () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'a'.repeat(40);
    const { getJwtSecret } = require('../utils/jwtSecret');
    expect(getJwtSecret()).toBe('a'.repeat(40));
  });
});
