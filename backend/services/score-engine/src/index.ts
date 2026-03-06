import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import cron from 'node-cron';
import logger from './config/logger';
import scoreRoutes from './routes/scoreRoutes';
import { TransactionEventWorker } from './workers/TransactionEventWorker';
import pool from './config/database';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '..', '.env') });

const app = express();
const PORT = process.env.SCORE_ENGINE_PORT || 3004;

app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
}));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'score-engine' });
});

app.use('/score', scoreRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, err.stack);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR' } });
});

const server = app.listen(PORT, () => {
    logger.info(`Score Engine Service running on port ${PORT}`);
});

// Nightly Recalculation Scheduled at 02:00 local time
cron.schedule('0 2 * * *', async () => {
    logger.info('Running nightly batch score recalculation...');
    try {
        // In prod, this would fetch all active users and batch process via SQS
        const users = await pool.query('SELECT "userId" FROM user_profiles');
        logger.info(`Found ${users.rows.length} users to recalculate.`);
        // Omitted full logic to avoid long blocks during hackathon
    } catch (err) {
        logger.error('Nightly batch failure', err);
    }
});

// Start the transaction worker
const sqsWorker = new TransactionEventWorker();
// sqsWorker.start().catch((err) => logger.error('Worker failed to start', err));

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, stopping SQS Worker.');
    sqsWorker.stop();
    server.close();
});

export default app;
