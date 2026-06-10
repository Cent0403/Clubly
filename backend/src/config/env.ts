import dotenv from 'dotenv';

dotenv.config();

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  port: Number(getEnv('PORT', '4000')),
  dbHost: getEnv('DB_HOST', 'localhost'),
  dbPort: Number(getEnv('DB_PORT', '3306')),
  dbUser: getEnv('DB_USER', 'root'),
  dbPassword: getEnv('DB_PASSWORD', ''),
  dbName: getEnv('DB_NAME', 'volleyball_stats'),
  jwtSecret: getEnv('JWT_SECRET', 'super_secret_change_me'),
  jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '8h')
};
