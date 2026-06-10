import { app } from './app';
import { env } from './config/env';
import { pool } from './db/pool';

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection successful.');

    app.listen(env.port, () => {
      console.log(`API running on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start API:', error);
    process.exit(1);
  }
}

void startServer();
