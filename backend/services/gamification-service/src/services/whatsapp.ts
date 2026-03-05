/**
 * whatsapp.ts — WhatsApp Bot Notification Service via Twilio
 *
 * Sends WhatsApp messages to split participants with payment links.
 * Uses Twilio's WhatsApp Business API (free sandbox for dev).
 *
 * In production, replace with official WhatsApp Business API or
 * use Twilio's approved templates.
 */

import logger from '../config/logger';

// Twilio config — loaded from environment
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

interface WhatsAppMessage {
    to: string;          // Phone number with country code (e.g., +919876543210)
    body: string;
    mediaUrl?: string;   // Optional image/document URL
}

/**
 * Send a WhatsApp message via Twilio API.
 * Falls back to mock/console logging if Twilio is not configured.
 */
export async function sendWhatsAppMessage(msg: WhatsAppMessage): Promise<{ success: boolean; sid?: string }> {
    const toFormatted = msg.to.startsWith('whatsapp:') ? msg.to : `whatsapp:${msg.to}`;

    // If Twilio not configured, mock the send
    if (!TWILIO_SID || !TWILIO_AUTH) {
        logger.info(`[WhatsApp MOCK] To: ${msg.to} | Body: ${msg.body}`);
        return { success: true, sid: `mock_${Date.now()}` };
    }

    try {
        // Dynamic import to avoid hard dependency
        const twilio = await import('twilio');
        const client = twilio.default(TWILIO_SID, TWILIO_AUTH);

        const result = await client.messages.create({
            from: TWILIO_WHATSAPP_FROM,
            to: toFormatted,
            body: msg.body,
        });

        logger.info(`WhatsApp sent to ${msg.to}: sid=${result.sid}`);
        return { success: true, sid: result.sid };
    } catch (error: any) {
        logger.error(`WhatsApp send failed to ${msg.to}: ${error.message}`);
        return { success: false };
    }
}

/**
 * Send a split payment request via WhatsApp.
 */
export async function sendSplitPaymentRequest(
    participantPhone: string,
    participantName: string,
    payerName: string,
    amount: number,
    description: string,
    paymentLink: string,
): Promise<{ success: boolean; sid?: string }> {
    const body =
        `💰 *VitalScore SplitSync*\n\n` +
        `Hi ${participantName}! ${payerName} has split a bill with you.\n\n` +
        `*${description}*\n` +
        `Your share: ₹${amount.toFixed(2)}\n\n` +
        `Pay now: ${paymentLink}\n\n` +
        `⏰ Please pay within 30 minutes to earn 15 XP!`;

    return sendWhatsAppMessage({ to: participantPhone, body });
}

/**
 * Send payment confirmation to the split initiator.
 */
export async function sendPaymentConfirmation(
    payerPhone: string,
    payerName: string,
    participantName: string,
    amount: number,
    remainingCount: number,
): Promise<{ success: boolean; sid?: string }> {
    const body =
        `✅ *VitalScore SplitSync*\n\n` +
        `${participantName} paid ₹${amount.toFixed(2)}!\n` +
        (remainingCount > 0
            ? `${remainingCount} payment(s) still pending.`
            : `🎉 All payments received! Split is complete.`);

    return sendWhatsAppMessage({ to: payerPhone, body });
}

/**
 * Send split completion notification.
 */
export async function sendSplitCompleteNotification(
    payerPhone: string,
    description: string,
    totalAmount: number,
): Promise<{ success: boolean; sid?: string }> {
    const body =
        `🎉 *VitalScore SplitSync — Complete!*\n\n` +
        `Your split "${description}" (₹${totalAmount.toFixed(2)}) is fully settled.\n` +
        `All participants have paid. +15 XP earned! 🏆`;

    return sendWhatsAppMessage({ to: payerPhone, body });
}

/**
 * Send a reminder for unpaid splits.
 */
export async function sendPaymentReminder(
    participantPhone: string,
    participantName: string,
    payerName: string,
    amount: number,
    paymentLink: string,
): Promise<{ success: boolean; sid?: string }> {
    const body =
        `⏰ *VitalScore Reminder*\n\n` +
        `Hi ${participantName}, a gentle reminder from ${payerName}.\n` +
        `You still owe ₹${amount.toFixed(2)}.\n\n` +
        `Pay now: ${paymentLink}`;

    return sendWhatsAppMessage({ to: participantPhone, body });
}
