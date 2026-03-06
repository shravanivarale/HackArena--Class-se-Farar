import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import logger from './config/logger';
import authRoutes from './routes/authRoutes';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '..', '.env') });

const app = express();
const PORT = process.env.AUTH_PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'auth-service', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`${err.message} - ${req.method} ${req.originalUrl} - ${req.ip}`, err.stack);
    res.status(500).json({
        success: false,
        meta: { requestId: req.headers['x-request-id'], timestamp: new Date().toISOString() },
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        }
    });
});

// Start server
app.listen(PORT, () => {
    logger.info(`Auth Service running on port ${PORT}`);
});

export default app;
