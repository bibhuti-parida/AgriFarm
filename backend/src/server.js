import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

const start = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL via Prisma');

    const server = app.listen(env.PORT, () => {
      console.log(`AgriFarm API server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Closing HTTP server and database connections...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Server and database connections successfully closed.');
        process.exit(0);
      });

      // Force exit after 10 seconds if not gracefully closed
      setTimeout(() => {
        console.error('Force shutdown after timeout.');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Promise Rejection:', reason);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();

