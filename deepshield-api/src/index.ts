import { httpServer } from './app.js';
import dotenv from 'dotenv';
import { seedDatabase } from './database/seed.js';
import { WhaleService } from './services/whale.service.js';

dotenv.config();

const PORT = process.env.PORT || 3002; // Change default port to 3002 to match frontend expectations

seedDatabase().then(() => {
  WhaleService.startIndexer();
});

httpServer.listen(PORT, () => {
  console.log(`DeepShield API running on port ${PORT}`);
});
