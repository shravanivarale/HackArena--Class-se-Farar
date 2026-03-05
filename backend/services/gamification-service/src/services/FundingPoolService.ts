/**
 * FundingPoolService.ts — Commitment Pool Backend Service
 *
 * Manages the funding pool lifecycle:
 * 1. Create pool (DB + blockchain)
 * 2. Join pool (DB + blockchain opt-in)
 * 3. Deposit funds (90% safe + 10% risk split)
 * 4. Early withdrawal (loses 10% risk)
 * 5. End-of-pool distribution (remaining get risk pool share)
 * 6. Auto-close when time expires or 1 member left
 */

import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import logger from '../config/logger';

const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3006';

interface CreatePoolInput {
    name: string;
    creatorUserId: string;
    minDeposit: number;
    maxMembers?: number;
    durationDays: number;
}

interface DepositInput {
    poolId: string;
    userId: string;
    amount: number;
}

export class FundingPoolService {

    /**
     * Create a new funding pool.
     */
    static async createPool(input: CreatePoolInput): Promise<any> {
        const poolId = uuidv4();
        const endTime = new Date(Date.now() + input.durationDays * 24 * 60 * 60 * 1000);
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Insert pool record
            await client.query(
                `INSERT INTO funding_pools
                 (pool_id, name, creator_user_id, min_deposit, max_members, duration_days, end_time)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [poolId, input.name, input.creatorUserId, input.minDeposit,
                 input.maxMembers || 20, input.durationDays, endTime]
            );

            // Auto-join creator as first member
            await client.query(
                `INSERT INTO pool_members (id, pool_id, user_id)
                 VALUES ($1, $2, $3)`,
                [uuidv4(), poolId, input.creatorUserId]
            );

            await client.query(
                `UPDATE funding_pools SET member_count = 1 WHERE pool_id = $1`,
                [poolId]
            );

            await client.query('COMMIT');

            // Deploy on-chain (non-blocking)
            let algoAppId: number | undefined;
            try {
                const blockchainResult = await FundingPoolService.deployOnChain(
                    poolId, Math.floor(endTime.getTime() / 1000),
                    Math.round(input.minDeposit * 1_000_000)
                );
                if (blockchainResult?.app_id) {
                    algoAppId = blockchainResult.app_id;
                    await pool.query(
                        `UPDATE funding_pools SET algo_app_id = $1, algo_tx_id = $2 WHERE pool_id = $3`,
                        [algoAppId, blockchainResult.tx_id, poolId]
                    );
                }
            } catch (err) {
                logger.warn(`On-chain pool deploy failed (non-blocking): ${err}`);
            }

            logger.info(`Pool created: ${poolId}, ends at ${endTime.toISOString()}`);

            return {
                poolId,
                name: input.name,
                status: 'ACTIVE',
                endTime: endTime.toISOString(),
                algoAppId,
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Join an existing pool.
     */
    static async joinPool(poolId: string, userId: string): Promise<any> {
        // Check pool exists and is active
        const { rows: poolRows } = await pool.query(
            `SELECT * FROM funding_pools WHERE pool_id = $1 AND status = 'ACTIVE'`,
            [poolId]
        );
        if (poolRows.length === 0) {
            throw new Error('Pool not found or not active');
        }

        const fundingPool = poolRows[0];
        if (fundingPool.member_count >= fundingPool.max_members) {
            throw new Error('Pool is full');
        }

        // Check not already a member
        const { rows: existing } = await pool.query(
            `SELECT id FROM pool_members WHERE pool_id = $1 AND user_id = $2`,
            [poolId, userId]
        );
        if (existing.length > 0) {
            throw new Error('Already a member of this pool');
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            await client.query(
                `INSERT INTO pool_members (id, pool_id, user_id)
                 VALUES ($1, $2, $3)`,
                [uuidv4(), poolId, userId]
            );

            await client.query(
                `UPDATE funding_pools SET member_count = member_count + 1 WHERE pool_id = $1`,
                [poolId]
            );

            await client.query('COMMIT');

            // On-chain opt-in (non-blocking)
            if (fundingPool.algo_app_id) {
                FundingPoolService.joinOnChain(fundingPool.algo_app_id, userId)
                    .catch(err => logger.warn(`On-chain join failed: ${err}`));
            }

            return { poolId, userId, status: 'ACTIVE' };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Deposit funds into a pool.
     * 90% safe, 10% risk split automatically.
     */
    static async deposit(input: DepositInput): Promise<any> {
        const { rows: poolRows } = await pool.query(
            `SELECT * FROM funding_pools WHERE pool_id = $1 AND status = 'ACTIVE'`,
            [input.poolId]
        );
        if (poolRows.length === 0) {
            throw new Error('Pool not found or not active');
        }

        const fundingPool = poolRows[0];
        if (input.amount < fundingPool.min_deposit) {
            throw new Error(`Minimum deposit is ₹${fundingPool.min_deposit}`);
        }

        const safeAmount = Math.round(input.amount * 0.9 * 100) / 100;
        const riskAmount = Math.round((input.amount - safeAmount) * 100) / 100;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Record deposit
            await client.query(
                `INSERT INTO pool_deposits (id, pool_id, user_id, amount, safe_amount, risk_amount)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [uuidv4(), input.poolId, input.userId, input.amount, safeAmount, riskAmount]
            );

            // Update member totals
            await client.query(
                `UPDATE pool_members
                 SET total_deposited = total_deposited + $1,
                     safe_portion = safe_portion + $2,
                     risk_portion = risk_portion + $3
                 WHERE pool_id = $4 AND user_id = $5`,
                [input.amount, safeAmount, riskAmount, input.poolId, input.userId]
            );

            // Update pool total
            await client.query(
                `UPDATE funding_pools SET total_deposited = total_deposited + $1 WHERE pool_id = $2`,
                [input.amount, input.poolId]
            );

            await client.query('COMMIT');

            // On-chain deposit (non-blocking)
            if (fundingPool.algo_app_id) {
                FundingPoolService.depositOnChain(
                    fundingPool.algo_app_id, input.userId,
                    Math.round(input.amount * 1_000_000)
                ).catch(err => logger.warn(`On-chain deposit failed: ${err}`));
            }

            logger.info(
                `Deposit: ₹${input.amount} to pool ${input.poolId} ` +
                `(safe: ₹${safeAmount}, risk: ₹${riskAmount})`
            );

            return {
                poolId: input.poolId,
                amount: input.amount,
                safeAmount,
                riskAmount,
                status: 'DEPOSITED',
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Early withdrawal — member gets 90% back, loses 10%.
     * The 10% is added to the risk pool for remaining members.
     */
    static async earlyWithdraw(poolId: string, userId: string): Promise<any> {
        const { rows: memberRows } = await pool.query(
            `SELECT * FROM pool_members WHERE pool_id = $1 AND user_id = $2 AND status = 'ACTIVE'`,
            [poolId, userId]
        );
        if (memberRows.length === 0) {
            throw new Error('Not an active member of this pool');
        }

        const member = memberRows[0];
        if (member.total_deposited <= 0) {
            throw new Error('No deposits to withdraw');
        }

        const safeReturned = member.safe_portion;
        const riskForfeited = member.risk_portion;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Record withdrawal
            await client.query(
                `INSERT INTO pool_withdrawals (id, pool_id, user_id, safe_returned, risk_forfeited)
                 VALUES ($1, $2, $3, $4, $5)`,
                [uuidv4(), poolId, userId, safeReturned, riskForfeited]
            );

            // Update member status
            await client.query(
                `UPDATE pool_members
                 SET status = 'WITHDRAWN', withdrawn_at = NOW(),
                     total_deposited = 0, safe_portion = 0, risk_portion = 0
                 WHERE pool_id = $1 AND user_id = $2`,
                [poolId, userId]
            );

            // Add forfeited risk to pool + update counters
            await client.query(
                `UPDATE funding_pools
                 SET risk_pool = risk_pool + $1,
                     total_deposited = total_deposited - $2,
                     member_count = member_count - 1
                 WHERE pool_id = $3`,
                [riskForfeited, member.total_deposited, poolId]
            );

            // Check if only 1 member remains → auto-distribute
            const { rows: poolState } = await client.query(
                `SELECT member_count FROM funding_pools WHERE pool_id = $1`,
                [poolId]
            );
            if (poolState[0].member_count <= 1) {
                await client.query(
                    `UPDATE funding_pools SET status = 'DISTRIBUTING' WHERE pool_id = $1`,
                    [poolId]
                );
            }

            await client.query('COMMIT');

            // On-chain early withdraw (non-blocking)
            const { rows: poolInfo } = await pool.query(
                `SELECT algo_app_id FROM funding_pools WHERE pool_id = $1`,
                [poolId]
            );
            if (poolInfo[0]?.algo_app_id) {
                FundingPoolService.earlyWithdrawOnChain(poolInfo[0].algo_app_id, userId)
                    .catch(err => logger.warn(`On-chain withdrawal failed: ${err}`));
            }

            logger.info(
                `Early withdrawal: user ${userId} from pool ${poolId} — ` +
                `returned ₹${safeReturned}, forfeited ₹${riskForfeited}`
            );

            return {
                poolId,
                safeReturned,
                riskForfeited,
                status: 'WITHDRAWN',
                message: `₹${safeReturned} returned. ₹${riskForfeited} forfeited to pool.`,
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Distribute pool funds at end of duration.
     * Remaining members get their deposit + share of risk pool.
     */
    static async distributePool(poolId: string): Promise<any> {
        const { rows: poolRows } = await pool.query(
            `SELECT * FROM funding_pools WHERE pool_id = $1 AND status IN ('ACTIVE', 'DISTRIBUTING')`,
            [poolId]
        );
        if (poolRows.length === 0) {
            throw new Error('Pool not found or already completed');
        }

        const fundingPool = poolRows[0];

        // Get remaining active members
        const { rows: members } = await pool.query(
            `SELECT * FROM pool_members WHERE pool_id = $1 AND status = 'ACTIVE'`,
            [poolId]
        );

        if (members.length === 0) {
            await pool.query(
                `UPDATE funding_pools SET status = 'COMPLETED' WHERE pool_id = $1`,
                [poolId]
            );
            return { poolId, status: 'COMPLETED', distributions: [] };
        }

        const riskShare = members.length > 0
            ? Math.round((fundingPool.risk_pool / members.length) * 100) / 100
            : 0;

        const distributions: any[] = [];
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (const member of members) {
                const payout = member.total_deposited + riskShare;

                await client.query(
                    `UPDATE pool_members
                     SET status = 'DISTRIBUTED', payout_amount = $1, withdrawn_at = NOW()
                     WHERE id = $2`,
                    [payout, member.id]
                );

                distributions.push({
                    userId: member.user_id,
                    deposited: member.total_deposited,
                    riskBonus: riskShare,
                    totalPayout: payout,
                });

                // On-chain distribution (non-blocking)
                if (fundingPool.algo_app_id) {
                    FundingPoolService.distributeOnChain(fundingPool.algo_app_id, member.user_id)
                        .catch(err => logger.warn(`On-chain distribute failed: ${err}`));
                }
            }

            await client.query(
                `UPDATE funding_pools SET status = 'COMPLETED' WHERE pool_id = $1`,
                [poolId]
            );

            await client.query('COMMIT');

            logger.info(`Pool ${poolId} distributed to ${members.length} members`);
            return { poolId, status: 'COMPLETED', distributions };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get pool details.
     */
    static async getPool(poolId: string): Promise<any> {
        const { rows } = await pool.query(
            `SELECT fp.*,
                    json_agg(json_build_object(
                        'userId', pm.user_id,
                        'totalDeposited', pm.total_deposited,
                        'safePortion', pm.safe_portion,
                        'riskPortion', pm.risk_portion,
                        'status', pm.status,
                        'joinedAt', pm.joined_at
                    )) AS members
             FROM funding_pools fp
             LEFT JOIN pool_members pm ON pm.pool_id = fp.pool_id
             WHERE fp.pool_id = $1
             GROUP BY fp.pool_id`,
            [poolId]
        );
        if (rows.length === 0) throw new Error('Pool not found');
        return rows[0];
    }

    /**
     * Get pools for a user.
     */
    static async getUserPools(userId: string): Promise<any[]> {
        const { rows } = await pool.query(
            `SELECT fp.*, pm.total_deposited AS my_deposit, pm.safe_portion AS my_safe,
                    pm.risk_portion AS my_risk, pm.status AS my_status
             FROM funding_pools fp
             JOIN pool_members pm ON pm.pool_id = fp.pool_id AND pm.user_id = $1
             ORDER BY fp.created_at DESC`,
            [userId]
        );
        return rows;
    }

    /**
     * Check and process expired pools (called by cron job).
     */
    static async processExpiredPools(): Promise<void> {
        const { rows } = await pool.query(
            `SELECT pool_id FROM funding_pools
             WHERE status = 'ACTIVE' AND end_time <= NOW()`
        );

        for (const row of rows) {
            try {
                await FundingPoolService.distributePool(row.pool_id);
                logger.info(`Auto-distributed expired pool: ${row.pool_id}`);
            } catch (err) {
                logger.error(`Failed to process expired pool ${row.pool_id}: ${err}`);
            }
        }
    }

    // ─── Blockchain Helpers ───

    private static async deployOnChain(
        poolId: string, endTimestamp: number, minDeposit: number
    ): Promise<any> {
        try {
            const response = await fetch(`${BLOCKCHAIN_SERVICE_URL}/blockchain/pool/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ poolId, endTime: endTimestamp, minDeposit }),
            });
            const result = await response.json();
            return result.data;
        } catch (err) {
            logger.warn(`Blockchain pool deploy failed: ${err}`);
            return null;
        }
    }

    private static async joinOnChain(appId: number, memberAddress: string): Promise<void> {
        try {
            await fetch(`${BLOCKCHAIN_SERVICE_URL}/blockchain/pool/${appId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberAddress }),
            });
        } catch (err) {
            logger.warn(`On-chain join failed: ${err}`);
        }
    }

    private static async depositOnChain(
        appId: number, memberAddress: string, amount: number
    ): Promise<void> {
        try {
            await fetch(`${BLOCKCHAIN_SERVICE_URL}/blockchain/pool/${appId}/deposit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberAddress, amount }),
            });
        } catch (err) {
            logger.warn(`On-chain deposit failed: ${err}`);
        }
    }

    private static async earlyWithdrawOnChain(appId: number, memberAddress: string): Promise<void> {
        try {
            await fetch(`${BLOCKCHAIN_SERVICE_URL}/blockchain/pool/${appId}/withdraw`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberAddress }),
            });
        } catch (err) {
            logger.warn(`On-chain withdrawal failed: ${err}`);
        }
    }

    private static async distributeOnChain(appId: number, memberAddress: string): Promise<void> {
        try {
            await fetch(`${BLOCKCHAIN_SERVICE_URL}/blockchain/pool/${appId}/distribute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ memberAddress }),
            });
        } catch (err) {
            logger.warn(`On-chain distribute failed: ${err}`);
        }
    }
}
