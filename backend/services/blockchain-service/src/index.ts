import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import logger from './config/logger';
import blockchainRoutes from './routes/blockchainRoutes';
import { checkAlgorandStatus } from './config/algorand';

dotenv.config();

const app = express();
const PORT = process.env.BLOCKCHAIN_PORT || 3006;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'blockchain-service' });
});

app.use('/blockchain', blockchainRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, err.stack);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR' } });
});

const server = app.listen(PORT, async () => {
    logger.info(`Blockchain Service running on port ${PORT}`);
    await checkAlgorandStatus();
});

export default app;
