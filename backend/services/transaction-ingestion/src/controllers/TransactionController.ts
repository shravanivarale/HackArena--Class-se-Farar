import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import logger from '../config/logger';
import { RazorpayService } from '../services/RazorpayService';
import { NormalizationService } from '../services/NormalizationService';
import { SQSPublisher } from '../services/SQSPublisher';

export class TransactionController {

    /**
     * POST /connections
     */
    static async createConnection(req: Request, res: Response): Promise<void> {
        try {
            const { userId, phone } = req.body;

            // Create a Razorpay order for bank account verification
            const order = await RazorpayService.createOrder(
                100,  // ₹1 verification charge (in paise)
                'INR',
                `conn_${userId}_${Date.now()}`,
                { userId, phone }
            );

            // Store connection status locally as pending
            const connectionId = uuidv4();
            await pool.query(
                'INSERT INTO bank_connections ("connectionId", "userId", status, "bankName") VALUES ($1, $2, $3, $4)',
                [connectionId, userId, 'PENDING', 'UNKNOWN']
            );

            res.status(200).json({
                success: true,
                data: {
                    connectionId,
                    razorpayOrderId: order.orderId,
                    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
                    amount: order.amount,
                    currency: order.currency,
                }
            });
        } catch (error) {
            logger.error('Failed to create bank connection', error);
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    }

    /**
     * GET /connections/:userId
     */
    static async getConnections(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const result = await pool.query('SELECT * FROM bank_connections WHERE "userId" = $1', [userId]);

            res.status(200).json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    }

    /**
     * POST /transactions/manual
     */
    static async addManualTransaction(req: Request, res: Response): Promise<void> {
        try {
            const { userId, amount, currency, merchantRaw, date, category } = req.body;

            const txnId = uuidv4();
            const userToken = NormalizationService.tokenizePII(userId);
            const merchantNormalized = NormalizationService.normalizeMerchantName(merchantRaw);

            const transactionData = {
                txnId,
                userToken,
                externalRef: `MANUAL-${txnId}`,
                amount,
                currency: currency || 'INR',
                date,
                merchantNormalized,
                merchantRaw,
                category: {
                    primary: category.primary,
                    secondary: category.secondary,
                    confidence: 1.0,
                    source: 'USER_OVERRIDE' // Manual counts as user override essentially
                },
                isRecurring: false,
                isShared: false,
                sharedUserShare: 1.0,
                isManualEntry: true,
                flaggedForReview: false
            };

            // In a real system we do DB writes with transactions.
            await pool.query(
                `INSERT INTO transaction_records 
        ("txnId", "userToken", "externalRef", amount, currency, date, "merchantNormalized", "merchantRaw", category, "isManualEntry") 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [txnId, userToken, transactionData.externalRef, amount, transactionData.currency, date, merchantNormalized, merchantRaw, JSON.stringify(transactionData.category), true]
            );

            // Publish to SQS for scoring engine
            await SQSPublisher.publishTransactionEvent(transactionData);

            res.status(201).json({
                success: true,
                data: transactionData
            });
        } catch (error) {
            logger.error('Failed to add manual transaction', error);
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    }

    /**
     * GET /transactions/:userId?page=1&limit=50
     */
    static async getTransactions(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const userToken = NormalizationService.tokenizePII(userId);
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const offset = (page - 1) * limit;

            const result = await pool.query(
                'SELECT * FROM transaction_records WHERE "userToken" = $1 ORDER BY date DESC LIMIT $2 OFFSET $3',
                [userToken, limit, offset]
            );

            const countResult = await pool.query('SELECT COUNT(*) FROM transaction_records WHERE "userToken" = $1', [userToken]);
            const total = parseInt(countResult.rows[0].count);

            res.status(200).json({
                success: true,
                data: result.rows,
                meta: {
                    page,
                    limit,
                    total
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    }

    /**
     * PATCH /transactions/:txnId/category
     */
    static async overrideCategory(req: Request, res: Response): Promise<void> {
        try {
            const { txnId } = req.params;
            const { category } = req.body;

            const newCategory = {
                primary: category.primary,
                secondary: category.secondary,
                confidence: 1.0,
                source: 'USER_OVERRIDE'
            };

            await pool.query(
                'UPDATE transaction_records SET category = $1, "userOverride" = $2 WHERE "txnId" = $3 RETURNING *',
                [JSON.stringify(newCategory), JSON.stringify(category), txnId]
            );

            // We should ideally fire a recount event for ScoreEngine here, or SQS
            const updatedItem = (await pool.query('SELECT * FROM transaction_records WHERE "txnId" = $1', [txnId])).rows[0];
            await SQSPublisher.publishTransactionEvent({ ...updatedItem, reCalcFlag: true });

            res.status(200).json({
                success: true,
                data: newCategory
            });
        } catch (error) {
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    }
}
