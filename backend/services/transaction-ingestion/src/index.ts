import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import logger from './config/logger';
import transactionRoutes from './routes/transactionRoutes';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '..', '.env') });

const app = express();
const PORT = process.env.TRANSACTION_PORT || 3003;

app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
}));
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'transaction-ingestion' });
});

// Use routes
app.use('/transactions', transactionRoutes);

// Error Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, err.stack);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Unexpected error from transaction service'
        }
    });
});

app.listen(PORT, () => {
    logger.info(`Transaction Ingestion Service running on port ${PORT}`);
});

export default app;
