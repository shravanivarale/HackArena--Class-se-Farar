import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import logger from './config/logger';
import categorizationRoutes from './routes/categorizationRoutes';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '..', '.env') });

const app = express();
const PORT = process.env.AI_PORT || 3007;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'ai-categorization-service' });
});

app.use('/ml', categorizationRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, err.stack);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR' } });
});

const server = app.listen(PORT, () => {
    logger.info(`AI/ML Categorization Service running on port ${PORT}`);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close();
});

export default app;
