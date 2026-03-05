import Razorpay from 'razorpay';
import crypto from 'crypto';
import logger from '../config/logger';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const isMockMode = !process.env.RAZORPAY_KEY_ID;

export class RazorpayService {

    /**
     * Create a Razorpay order for collecting payment.
     */
    static async createOrder(
        amount: number,
        currency: string = 'INR',
        receipt: string,
        notes: Record<string, string> = {}
    ): Promise<{ orderId: string; amount: number; currency: string; status: string }> {
        if (isMockMode) {
            logger.info(`[MOCK] Creating Razorpay order: ₹${amount / 100} ${currency}, receipt=${receipt}`);
            return {
                orderId: `order_mock_${Date.now()}`,
                amount,
                currency,
                status: 'created',
            };
        }

        try {
            const order = await razorpay.orders.create({
                amount,         // Razorpay expects amount in paise
                currency,
                receipt,
                notes,
            });

            logger.info(`Razorpay order created: ${order.id}`);
            return {
                orderId: order.id,
                amount: order.amount as number,
                currency: order.currency,
                status: order.status,
            };
        } catch (error) {
            logger.error('Razorpay order creation failed', error);
            throw error;
        }
    }

    /**
     * Verify Razorpay payment signature to confirm authenticity.
     */
    static verifyPaymentSignature(
        orderId: string,
        paymentId: string,
        signature: string
    ): boolean {
        if (isMockMode) {
            logger.info(`[MOCK] Verifying payment: orderId=${orderId}, paymentId=${paymentId}`);
            return true;
        }

        const secret = process.env.RAZORPAY_KEY_SECRET || '';
        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        return expectedSignature === signature;
    }

    /**
     * Create a Razorpay Payment Link (for split bills, etc.).
     * Works without Checkout — recipient gets a link to pay.
     */
    static async createPaymentLink(params: {
        amount: number;
        description: string;
        customerName: string;
        customerPhone?: string;
        customerEmail?: string;
        receipt: string;
        callbackUrl?: string;
        expireBy?: number;
    }): Promise<{ linkId: string; shortUrl: string; amount: number; status: string }> {
        if (isMockMode) {
            const mockId = `plink_mock_${Date.now()}`;
            logger.info(`[MOCK] Creating Razorpay payment link: ₹${params.amount / 100} for ${params.customerName}`);
            return {
                linkId: mockId,
                shortUrl: `https://rzp.io/i/${mockId}`,
                amount: params.amount,
                status: 'created',
            };
        }

        try {
            const linkPayload: Record<string, any> = {
                amount: params.amount,   // in paise
                currency: 'INR',
                description: params.description,
                customer: {
                    name: params.customerName,
                    ...(params.customerPhone && { contact: params.customerPhone }),
                    ...(params.customerEmail && { email: params.customerEmail }),
                },
                notify: {
                    sms: !!params.customerPhone,
                    email: !!params.customerEmail,
                },
                reminder_enable: true,
                notes: { receipt: params.receipt },
                callback_url: params.callbackUrl || `${process.env.APP_BASE_URL || 'http://localhost:5173'}/payment/callback`,
                callback_method: 'get',
            };

            if (params.expireBy) {
                linkPayload.expire_by = params.expireBy;
            }

            const link = await (razorpay as any).paymentLink.create(linkPayload);

            logger.info(`Razorpay payment link created: ${link.id} → ${link.short_url}`);
            return {
                linkId: link.id,
                shortUrl: link.short_url,
                amount: link.amount,
                status: link.status,
            };
        } catch (error) {
            logger.error('Razorpay payment link creation failed', error);
            throw error;
        }
    }

    /**
     * Fetch payment details by payment ID.
     */
    static async fetchPayment(paymentId: string): Promise<any> {
        if (isMockMode) {
            logger.info(`[MOCK] Fetching payment: ${paymentId}`);
            return {
                id: paymentId,
                amount: 50000,
                currency: 'INR',
                status: 'captured',
                method: 'upi',
            };
        }

        try {
            const payment = await razorpay.payments.fetch(paymentId);
            return payment;
        } catch (error) {
            logger.error(`Failed to fetch payment ${paymentId}`, error);
            throw error;
        }
    }

    /**
     * Fetch 90-day historical transactions (mock for hackathon).
     * In production, this would pull from Razorpay Route / linked bank data.
     */
    static async fetchHistoricalTransactions(connectionId: string): Promise<any[]> {
        logger.info(`Fetching 90-day transaction history for connection: ${connectionId}`);

        return [
            {
                id: 'external-txn-1',
                amount: 850.00,
                type: 'DEBIT',
                description: 'Zomato Ltd 18001234567',
                timestamp: new Date().toISOString(),
            },
            {
                id: 'external-txn-2',
                amount: 45000.00,
                type: 'CREDIT',
                description: 'SALARY NEFT',
                timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                id: 'external-txn-3',
                amount: 3000.00,
                type: 'DEBIT',
                description: 'MAHANAGAR GAS LTD',
                timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            },
        ];
    }
}
