import dotenv from 'dotenv';

process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.DATABASE_URL = 'postgresql://test_user:test_pass@localhost:5432/agrifarm_test?schema=public';
process.env.JWT_SECRET = 'test_secret_key_at_least_32_characters_long_for_agrifarm';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_SALT_ROUNDS = '10';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.WEATHER_API_KEY = '';
process.env.MARKET_DATA_API_KEY = '';

dotenv.config({ path: '.env.test', quiet: true });

