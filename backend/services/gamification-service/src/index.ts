import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import logger from './config/logger';
import gamificationRoutes from './routes/gamificationRoutes';
import cron from 'node-cron';
import pool from './config/database';
import { FundingPoolService } from './services/FundingPoolService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'gamification-service' });
});

app.use('/gamification', gamificationRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, err.stack);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR' } });
});

const server = app.listen(PORT, () => {
    logger.info(`Gamification Service running on port ${PORT}`);
});

// Periodic Jobs Placeholder
cron.schedule('0 0 * * 0', () => { // Every Sunday at midnight
    logger.info('Running weekly leaderboard and challenge resolution triggers...');
    // Logic to lock previous week's challenges, calculate yields, mint badges.
});

// Check for expired funding pools every hour
cron.schedule('0 * * * *', async () => {
    logger.info('Checking for expired funding pools...');
    try {
        await FundingPoolService.processExpiredPools();
    } catch (err) {
        logger.error('Failed to process expired pools', err);
    }
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        pool.end();
    });
});

export default app;
