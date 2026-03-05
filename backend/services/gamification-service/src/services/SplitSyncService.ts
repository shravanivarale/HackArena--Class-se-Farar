/**
 * SplitSyncService.ts — Full SplitSync Bill Splitting Service
 *
 * Manages the complete split lifecycle:
 * 1. Create split (DB + blockchain)
 * 2. Send WhatsApp notifications to participants
 * 3. Generate payment links (UPI deep links)
 * 4. Record payments (DB + blockchain)
 * 5. Send confirmations to initiator
 * 6. Mark complete when all paid
 */

import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import logger from '../config/logger';
import {
    sendSplitPaymentRequest,
    sendPaymentConfirmation,
    sendSplitCompleteNotification,
    sendPaymentReminder,
} from './whatsapp';

const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3006';

interface CreateSplitInput {
    payerUserId: string;
    payerName: string;
    payerPhone?: string;
    totalAmount: number;
    description: string;
    merchant?: string;
    participants: Array<{
        userId?: string;
        name: string;
        phone?: string;
        amount: number;
    }>;
}

interface SplitResult {
    splitId: string;
    status: string;
    participants: Array<{
        name: string;
        amountOwed: number;
        paymentLink: string | null;
        notified: boolean;
    }>;
    algoAppId?: number;
}

export class SplitSyncService {

    /**
     * Create a new bill split.
     * - Stores in PostgreSQL
     * - Deploys on-chain contract for transparency
     * - Sends WhatsApp notifications with payment links
     */
    static async createSplit(input: CreateSplitInput): Promise<SplitResult> {
        const splitId = uuidv4();
        const deadline = new Date(Date.now() + 30 * 60 * 1000); // 30 min
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Insert split record
            await client.query(
                `INSERT INTO splits (split_id, payer_user_id, total_amount, currency, description, merchant, deadline)
                 VALUES ($1, $2, $3, 'INR', $4, $5, $6)`,
                [splitId, input.payerUserId, input.totalAmount, input.description, input.merchant || null, deadline]
            );

            // 2. Insert participants
            const participantResults: SplitResult['participants'] = [];

            for (const p of input.participants) {
                const participantId = uuidv4();
                await client.query(
                    `INSERT INTO split_participants (id, split_id, user_id, name, phone, amount_owed)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [participantId, splitId, p.userId || null, p.name, p.phone || null, p.amount]
                );

                // 3. Generate payment link (UPI deep link)
                const paymentLink = SplitSyncService.generatePaymentLink(
                    splitId, participantId, p.amount, input.description
                );

                // Store payment link
                await client.query(
                    `INSERT INTO split_payment_links (id, split_id, participant_id, payment_url, upi_deeplink, expires_at)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        uuidv4(), splitId, participantId,
                        paymentLink.webUrl, paymentLink.upiDeeplink,
                        deadline,
                    ]
                );

                // 4. Send WhatsApp notification (if phone provided)
                let notified = false;
                if (p.phone) {
                    const whatsappResult = await sendSplitPaymentRequest(
                        p.phone, p.name, input.payerName,
                        p.amount, input.description, paymentLink.webUrl
                    );
                    notified = whatsappResult.success;

                    if (notified) {
                        await client.query(
                            `UPDATE split_participants SET notified_at = NOW() WHERE id = $1`,
                            [participantId]
                        );
                    }
                }

                participantResults.push({
                    name: p.name,
                    amountOwed: p.amount,
                    paymentLink: paymentLink.webUrl,
                    notified,
                });
            }

            await client.query('COMMIT');

            // 5. Deploy on-chain contract (async, non-blocking)
            let algoAppId: number | undefined;
            try {
                const blockchainResult = await SplitSyncService.deployOnChain(
                    splitId, input.payerUserId, input.totalAmount,
                    input.participants.length, Math.floor(deadline.getTime() / 1000)
                );
                if (blockchainResult?.app_id) {
                    algoAppId = blockchainResult.app_id;
                    await pool.query(
                        `UPDATE splits SET algo_app_id = $1, algo_tx_id = $2 WHERE split_id = $3`,
                        [algoAppId, blockchainResult.tx_id, splitId]
                    );
                }
            } catch (err) {
                logger.warn(`On-chain split deploy failed (non-blocking): ${err}`);
            }

            logger.info(`Split created: ${splitId} with ${input.participants.length} participants`);

            return { splitId, status: 'PENDING', participants: participantResults, algoAppId };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Record a participant's payment.
     * Updates DB, syncs on-chain, notifies initiator.
     */
    static async recordPayment(
        splitId: string,
        participantId: string,
        paymentMethod: string = 'UPI',
        paymentRef: string = '',
    ): Promise<{ success: boolean; allPaid: boolean; xpEarned: number }> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Mark participant as paid
            await client.query(
                `UPDATE split_participants
                 SET paid_status = 'PAID', paid_at = NOW(),
                     payment_method = $1, payment_ref = $2
                 WHERE id = $3 AND split_id = $4 AND paid_status = 'UNPAID'`,
                [paymentMethod, paymentRef, participantId, splitId]
            );

            // Check how many are still unpaid
            const { rows } = await client.query(
                `SELECT COUNT(*) FILTER (WHERE paid_status = 'UNPAID') AS unpaid,
                        COUNT(*) AS total
                 FROM split_participants WHERE split_id = $1`,
                [splitId]
            );

            const unpaid = parseInt(rows[0].unpaid);
            const allPaid = unpaid === 0;

            // Update split status
            await client.query(
                `UPDATE splits SET status = $1 WHERE split_id = $2`,
                [allPaid ? 'SETTLED' : 'PARTIAL', splitId]
            );

            await client.query('COMMIT');

            // Get participant & payer info for notifications
            const participantInfo = await pool.query(
                `SELECT sp.name AS participant_name, sp.amount_owed,
                        s.payer_user_id, s.description, s.total_amount, s.algo_app_id,
                        up.algorand_address AS payer_address
                 FROM split_participants sp
                 JOIN splits s ON s.split_id = sp.split_id
                 LEFT JOIN user_profiles up ON up.user_id = s.payer_user_id
                 WHERE sp.id = $1`,
                [participantId]
            );

            if (participantInfo.rows.length > 0) {
                const info = participantInfo.rows[0];

                // Record on-chain (non-blocking)
                if (info.algo_app_id) {
                    SplitSyncService.recordPaymentOnChain(
                        info.algo_app_id, info.payer_address || ''
                    ).catch(err => logger.warn(`On-chain payment sync failed: ${err}`));
                }

                // Notify initiator via WhatsApp (if we have their phone)
                const payerPhone = await SplitSyncService.getUserPhone(info.payer_user_id);
                if (payerPhone) {
                    if (allPaid) {
                        await sendSplitCompleteNotification(
                            payerPhone, info.description, info.total_amount
                        );
                    } else {
                        await sendPaymentConfirmation(
                            payerPhone, '', info.participant_name,
                            info.amount_owed, unpaid
                        );
                    }
                }
            }

            return { success: true, allPaid, xpEarned: 15 };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get all splits for a user (as payer or participant).
     */
    static async getUserSplits(userId: string): Promise<any[]> {
        const { rows } = await pool.query(
            `SELECT s.*, 
                    json_agg(json_build_object(
                        'id', sp.id,
                        'name', sp.name,
                        'amountOwed', sp.amount_owed,
                        'paidStatus', sp.paid_status,
                        'paidAt', sp.paid_at
                    )) AS participants
             FROM splits s
             JOIN split_participants sp ON sp.split_id = s.split_id
             WHERE s.payer_user_id = $1
                OR s.split_id IN (
                    SELECT split_id FROM split_participants WHERE user_id = $1
                )
             GROUP BY s.split_id
             ORDER BY s.created_at DESC`,
            [userId]
        );
        return rows;
    }

    /**
     * Get active (pending/partial) splits for a user.
     */
    static async getActiveSplits(userId: string): Promise<any[]> {
        const { rows } = await pool.query(
            `SELECT s.*, 
                    json_agg(json_build_object(
                        'id', sp.id,
                        'name', sp.name,
                        'amountOwed', sp.amount_owed,
                        'paidStatus', sp.paid_status,
                        'paidAt', sp.paid_at
                    )) AS participants
             FROM splits s
             JOIN split_participants sp ON sp.split_id = s.split_id
             WHERE (s.payer_user_id = $1 OR s.split_id IN (
                 SELECT split_id FROM split_participants WHERE user_id = $1
             ))
             AND s.status IN ('PENDING', 'PARTIAL')
             GROUP BY s.split_id
             ORDER BY s.created_at DESC`,
            [userId]
        );
        return rows;
    }

    /**
     * Send reminder to unpaid participants.
     */
    static async sendReminders(splitId: string): Promise<{ sent: number }> {
        const { rows } = await pool.query(
            `SELECT sp.name, sp.phone, sp.amount_owed, sp.id AS participant_id,
                    s.description, up_payer.algorand_address AS payer_name
             FROM split_participants sp
             JOIN splits s ON s.split_id = sp.split_id
             LEFT JOIN user_profiles up_payer ON up_payer.user_id = s.payer_user_id
             WHERE sp.split_id = $1 AND sp.paid_status = 'UNPAID' AND sp.phone IS NOT NULL`,
            [splitId]
        );

        let sent = 0;
        for (const row of rows) {
            const link = SplitSyncService.generatePaymentLink(
                splitId, row.participant_id, row.amount_owed, row.description
            );
            const result = await sendPaymentReminder(
                row.phone, row.name, row.payer_name || 'Your friend',
                row.amount_owed, link.webUrl
            );
            if (result.success) {
                sent++;
                await pool.query(
                    `UPDATE split_participants SET reminder_count = reminder_count + 1 WHERE id = $1`,
                    [row.participant_id]
                );
            }
        }

        return { sent };
    }

    /**
     * Cancel a split.
     */
    static async cancelSplit(splitId: string, userId: string): Promise<{ success: boolean }> {
        const { rowCount } = await pool.query(
            `UPDATE splits SET status = 'CANCELLED'
             WHERE split_id = $1 AND payer_user_id = $2 AND status IN ('PENDING', 'PARTIAL')`,
            [splitId, userId]
        );
        return { success: (rowCount ?? 0) > 0 };
    }

    // ─── Private Helpers ───

    private static generatePaymentLink(
        splitId: string, participantId: string, amount: number, description: string
    ): { webUrl: string; upiDeeplink: string } {
        const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
        const upiId = process.env.UPI_MERCHANT_ID || 'vitalscore@upi';

        // UPI deep link (works on all UPI apps in India)
        const upiDeeplink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=VitalScore&am=${amount}&cu=INR&tn=${encodeURIComponent(description)}&tr=${participantId}`;

        // Web payment page
        const webUrl = `${baseUrl}/pay/${splitId}/${participantId}`;

        return { webUrl, upiDeeplink };
    }

    private static async getUserPhone(userId: string): Promise<string | null> {
        try {
            const { rows } = await pool.query(
                `SELECT notification_preferences->>'phone' AS phone FROM user_profiles WHERE user_id = $1`,
                [userId]
            );
            return rows[0]?.phone || null;
        } catch {
            return null;
        }
    }

    private static async deployOnChain(
        splitId: string, payerAddress: string, totalAmount: number,
        participantCount: number, deadline: number
    ): Promise<any> {
        try {
            const response = await fetch(`${BLOCKCHAIN_SERVICE_URL}/blockchain/splitsync/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    splitId,
                    payerAddress,
                    totalAmount: Math.round(totalAmount * 1_000_000), // Convert to microAlgos
                    participantCount,
                    deadline,
                }),
            });
            const result = await response.json();
            return result.data;
        } catch (err) {
            logger.warn(`Blockchain deploy failed: ${err}`);
            return null;
        }
    }

    private static async recordPaymentOnChain(appId: number, participantAddress: string): Promise<void> {
        try {
            await fetch(`${BLOCKCHAIN_SERVICE_URL}/blockchain/splitsync/${appId}/record_payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participantAddress }),
            });
        } catch (err) {
            logger.warn(`On-chain payment recording failed: ${err}`);
        }
    }
}
