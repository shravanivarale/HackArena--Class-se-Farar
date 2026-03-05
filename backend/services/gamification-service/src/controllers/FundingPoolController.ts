/**
 * FundingPoolController.ts — API endpoints for Funding Pool (Commitment Pool).
 */

import { Request, Response } from 'express';
import logger from '../config/logger';
import { FundingPoolService } from '../services/FundingPoolService';

export class FundingPoolController {

    static async createPool(req: Request, res: Response): Promise<void> {
        try {
            const { name, creatorUserId, minDeposit, maxMembers, durationDays } = req.body;

            if (!name || !creatorUserId || !durationDays) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Missing required fields: name, creatorUserId, durationDays' },
                });
                return;
            }

            const result = await FundingPoolService.createPool({
                name, creatorUserId, minDeposit: minDeposit || 100,
                maxMembers, durationDays,
            });

            res.status(201).json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error creating pool', error);
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
        }
    }

    static async joinPool(req: Request, res: Response): Promise<void> {
        try {
            const { poolId } = req.params;
            const { userId } = req.body;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Missing userId' },
                });
                return;
            }

            const result = await FundingPoolService.joinPool(poolId, userId);
            res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error joining pool', error);
            res.status(400).json({ success: false, error: { code: 'JOIN_ERROR', message: error.message } });
        }
    }

    static async deposit(req: Request, res: Response): Promise<void> {
        try {
            const { poolId } = req.params;
            const { userId, amount } = req.body;

            if (!userId || !amount || amount <= 0) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Missing userId or valid amount' },
                });
                return;
            }

            const result = await FundingPoolService.deposit({ poolId, userId, amount });
            res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error depositing to pool', error);
            res.status(400).json({ success: false, error: { code: 'DEPOSIT_ERROR', message: error.message } });
        }
    }

    static async earlyWithdraw(req: Request, res: Response): Promise<void> {
        try {
            const { poolId } = req.params;
            const { userId } = req.body;

            if (!userId) {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Missing userId' },
                });
                return;
            }

            const result = await FundingPoolService.earlyWithdraw(poolId, userId);
            res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error withdrawing from pool', error);
            res.status(400).json({ success: false, error: { code: 'WITHDRAW_ERROR', message: error.message } });
        }
    }

    static async distributePool(req: Request, res: Response): Promise<void> {
        try {
            const { poolId } = req.params;
            const result = await FundingPoolService.distributePool(poolId);
            res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error distributing pool', error);
            res.status(500).json({ success: false, error: { code: 'DISTRIBUTION_ERROR', message: error.message } });
        }
    }

    static async getPool(req: Request, res: Response): Promise<void> {
        try {
            const { poolId } = req.params;
            const result = await FundingPoolService.getPool(poolId);
            res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            logger.error('Error fetching pool', error);
            res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: error.message } });
        }
    }

    static async getUserPools(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const pools = await FundingPoolService.getUserPools(userId);
            res.status(200).json({ success: true, data: pools });
        } catch (error: any) {
            logger.error('Error fetching user pools', error);
            res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
        }
    }
}
