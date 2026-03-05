/**
 * SplitSyncController.ts — API endpoints for SplitSync bill splitting.
 */

import { Request, Response } from 'express';
import logger from '../config/logger';
import { SplitSyncService } from '../services/SplitSyncService';

export class SplitSyncController {

    static async createSplit(req: Request, res: Response): Promise<void> {
        try {
            const { payerUserId, payerName, payerPhone, totalAmount, description, merchant, participants } = req.body;

            if (!payerUserId || !totalAmount || !description || !participants?.length) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
                });
                return;
            }

            const result = await SplitSyncService.createSplit({
                payerUserId, payerName, payerPhone, totalAmount, description, merchant, participants,
            });

            res.status(201).json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error creating split', error);
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
        }
    }

    static async recordPayment(req: Request, res: Response): Promise<void> {
        try {
            const { splitId, participantId } = req.params;
            const { paymentMethod, paymentRef } = req.body;

            const result = await SplitSyncService.recordPayment(
                splitId, participantId, paymentMethod, paymentRef
            );

            res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error recording payment', error);
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
        }
    }

    static async getUserSplits(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const splits = await SplitSyncService.getUserSplits(userId);
            res.status(200).json({ success: true, data: splits });
        } catch (error: any) {
            logger.error('Error fetching splits', error);
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    }

    static async getActiveSplits(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const splits = await SplitSyncService.getActiveSplits(userId);
            res.status(200).json({ success: true, data: splits });
        } catch (error: any) {
            logger.error('Error fetching active splits', error);
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    }

    static async sendReminders(req: Request, res: Response): Promise<void> {
        try {
            const { splitId } = req.params;
            const result = await SplitSyncService.sendReminders(splitId);
            res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error sending reminders', error);
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    }

    static async cancelSplit(req: Request, res: Response): Promise<void> {
        try {
            const { splitId } = req.params;
            const { userId } = req.body;
            const result = await SplitSyncService.cancelSplit(splitId, userId);
            res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error cancelling split', error);
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    }
}
