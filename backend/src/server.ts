import { app } from './app.js';
import { connectDatabase, dbHealthcheck } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
    await dbHealthcheck();
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`AccounTech backend running on port ${env.port}`);
    }).on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        // eslint-disable-next-line no-console
        console.error(`Port ${env.port} is already in use. Stop the existing process on that port and restart the backend.`);
        process.exit(1);
      }
      throw error;
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

void bootstrap();
