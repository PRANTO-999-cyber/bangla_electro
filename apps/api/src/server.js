import app from './app.js';
import { connectDB, ensureAdminAccount, ensureIndexes } from './config/db.js';
import { env } from './config/env.js';
import { markAllExpiredReservations } from './controllers/paymentController.js';

app.listen(env.port, () => console.log(`API: http://localhost:${env.port}`));

let databaseInitialized = false;

async function initializeDatabase() {
  try {
    await connectDB();
    await ensureIndexes();
    await ensureAdminAccount();
    await markAllExpiredReservations();
    databaseInitialized = true;

    const reservationCleanup = setInterval(() => {
      markAllExpiredReservations().catch((error) => {
        console.error('Expired payment reservation cleanup failed', {
          message: error.message,
        });
      });
    }, 60_000);
    reservationCleanup.unref();
  } catch (error) {
    console.error('API database initialization failed; retrying in 10 seconds', {
      message: error.message,
    });
    setTimeout(() => {
      if (!databaseInitialized) void initializeDatabase();
    }, 10_000).unref();
  }
}

void initializeDatabase();
