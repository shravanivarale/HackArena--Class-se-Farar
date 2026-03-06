import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import logger from './config/logger';
import gamificationRoutes from './routes/gamificationRoutes';
import cron from 'node-cron';
import pool from './config/database';
import { FundingPoolService } from './services/FundingPoolService';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '..', '.env') });

const app = express();
const PORT = process.env.GAMIFICATION_PORT || 3005;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || '*' }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'gamification-service' });
});

// Real WhatsApp Send Endpoint
app.post('/whatsapp/send', async (req: Request, res: Response): Promise<any> => {
    try {
        const { to, message } = req.body;

        if (!to || typeof to !== 'string') {
            return res.status(400).json({ success: false, error: "Missing or invalid 'to' phone number" });
        }
        if (!message) {
            return res.status(400).json({ success: false, error: "Missing 'message' content" });
        }

        // Ensure credentials exist before using Twilio
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            logger.warn(`[WHATSAPP MOCK] Twilio missing auth tokens. Message to ${to}: ${message}`);
            return res.status(200).json({ success: true, messageId: `mock_${Date.now()}` });
        }

        // Initialize Twilio client inline for scope
        const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        // Twilio requires 'whatsapp:' prefix for numbers
        const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

        // Grab sandbox 'From' number from env variables, fallback to generic Twilio sandbox
        let fromNumber = process.env.TWILIO_WHATSAPP_FROM || '+14155238886';
        fromNumber = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

        logger.info(`[WHATSAPP] Attempting to send to ${formattedTo} from ${fromNumber}`);

        const response = await twilioClient.messages.create({
            body: message,
            from: fromNumber,
            to: formattedTo
        });

        logger.info(`[WHATSAPP SENT] Message SID ${response.sid} to ${formattedTo}`);
        res.status(200).json({ success: true, messageId: response.sid });
    } catch (err: any) {
        logger.error(`[WHATSAPP ERROR] Failed to send via Twilio:`, err.message || err);
        // Return 400 so the frontend can display the Twilio Sandbox error to the user
        res.status(400).json({ success: false, error: err.message || 'Failed to send WhatsApp message' });
    }
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
