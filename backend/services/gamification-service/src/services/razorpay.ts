import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const isMockMode = !process.env.RAZORPAY_KEY_ID;

/**
 * Create a Razorpay Payment Link for a split participant.
 * Returns a short URL that the participant can open to pay via UPI/card/netbanking.
 */
export async function createSplitPaymentLink(params: {
    splitId: string;
    participantId: string;
    participantName: string;
    participantPhone?: string;
    amount: number;         // in rupees (will be converted to paise)
    description: string;
    expireBy?: number;      // unix timestamp
}): Promise<{ linkId: string; shortUrl: string }> {
    const amountPaise = Math.round(params.amount * 100);

    if (isMockMode) {
        const mockId = `plink_mock_${Date.now()}`;
        console.log(`[MOCK Razorpay] Payment link: ₹${params.amount} for ${params.participantName} (split ${params.splitId})`);
        return {
            linkId: mockId,
            shortUrl: `https://rzp.io/i/${mockId}`,
        };
    }

    const linkPayload: Record<string, any> = {
        amount: amountPaise,
        currency: 'INR',
        description: `Split: ${params.description}`,
        customer: {
            name: params.participantName,
            ...(params.participantPhone && { contact: params.participantPhone }),
        },
        notify: {
            sms: !!params.participantPhone,
            email: false,
        },
        reminder_enable: true,
        notes: {
            splitId: params.splitId,
            participantId: params.participantId,
        },
        callback_url: `${process.env.APP_BASE_URL || 'http://localhost:5173'}/payment/callback?splitId=${params.splitId}&participantId=${params.participantId}`,
        callback_method: 'get',
    };

    if (params.expireBy) {
        linkPayload.expire_by = params.expireBy;
    }

    const link = await (razorpay as any).paymentLink.create(linkPayload);

    return {
        linkId: link.id,
        shortUrl: link.short_url,
    };
}

/**
 * Verify Razorpay webhook / callback signature.
 */
export function verifyRazorpaySignature(
    body: string,
    signature: string,
    secret?: string
): boolean {
    const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';
    const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');
    return expected === signature;
}
