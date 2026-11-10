import { Resend } from 'resend';
import { adminSupabase } from '../supabase/server';

const resendApiKey = process.env.RESEND_API_KEY || 're_sample_key';
export const resend = new Resend(resendApiKey);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Naija Street Arcade <onboarding@resend.dev>';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  templateName: string;
  userId?: string;
}

// Send transactional email and audit to Supabase email_logs
export async function sendArcadeEmail({
  to,
  subject,
  html,
  templateName,
  userId
}: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html
    });

    if (error) {
      console.warn('[Resend Email Error]', error);
      await logEmailToSupabase(to, userId, subject, templateName, null, 'failed', error.message);
      return { success: false, error: error.message };
    }

    const emailId = data?.id || null;
    await logEmailToSupabase(to, userId, subject, templateName, emailId, 'sent', null);
    return { success: true, emailId };
  } catch (err: any) {
    console.warn('[Resend Email Exception]', err);
    await logEmailToSupabase(to, userId, subject, templateName, null, 'failed', err?.message || 'Unknown error');
    return { success: false, error: err?.message };
  }
}

async function logEmailToSupabase(
  to: string,
  userId: string | undefined,
  subject: string,
  templateName: string,
  resendId: string | null,
  status: 'sent' | 'failed',
  errorMessage: string | null
) {
  try {
    await adminSupabase.from('email_logs').insert({
      recipient_email: to,
      recipient_user_id: userId || null,
      subject,
      template_name: templateName,
      resend_id: resendId,
      status,
      error_message: errorMessage
    });
  } catch (e) {
    // Non-blocking fallback
  }
}

// 1. Welcome Email with 1,500 Street Coins
export async function sendWelcomeEmail(to: string, username: string, userId?: string) {
  const html = `
    <div style="font-family: sans-serif; background: #09090b; color: #f3f4f6; padding: 28px; border-radius: 16px;">
      <h1 style="color: #fbbf24; margin-bottom: 8px;">🦁 Welcome to Naija Street Arcade!</h1>
      <p style="font-size: 16px;">Hey <strong>${username}</strong>,</p>
      <p>Welcome to Nigeria's home of street football and classic games. We have credited your vault with:</p>
      <div style="background: #18181b; border: 1px solid #fbbf24; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 900; color: #34d399;">🪙 1,500 STREET COINS</span>
        <p style="margin: 4px 0 0 0; color: #a1a1aa; font-size: 13px;">Free Staking & Match Wagers Bonus</p>
      </div>
      <p>Play <strong>Monkey Post 3D</strong>, <strong>Naija Ludo 3D</strong>, <strong>Snooker 3D</strong>, and climb the Lagos street leaderboards today!</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; background: #fbbf24; color: #000; padding: 12px 24px; border-radius: 10px; font-weight: 800; text-decoration: none; margin-top: 10px;">
        START PLAYING NOW
      </a>
      <hr style="border: 0; border-top: 1px solid #27272a; margin-top: 24px;" />
      <p style="font-size: 11px; color: #71717a;">Warri No Dey Carry Last • Naija Street Arcade Ltd</p>
    </div>
  `;
  return sendArcadeEmail({
    to,
    subject: '🦁 Welcome to Naija Street Arcade! Claim your 1,500 Coins',
    html,
    templateName: 'welcome_bonus',
    userId
  });
}

// 2. Tournament Announcement Email
export async function sendTournamentAlertEmail(to: string, tournamentTitle: string, prizePool: string) {
  const html = `
    <div style="font-family: sans-serif; background: #09090b; color: #f3f4f6; padding: 28px; border-radius: 16px;">
      <h2 style="color: #fbbf24;">🏆 New Street Derby: ${tournamentTitle}</h2>
      <p>A new high-stakes tournament is now live on the arcade:</p>
      <p><strong>Prize Pool:</strong> ${prizePool}</p>
      <p>Slots are limited. Enter your street team before the bracket closes!</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background: #10b981; color: #000; padding: 10px 20px; border-radius: 8px; font-weight: bold; text-decoration: none;">
        Join Tournament Bracket
      </a>
    </div>
  `;
  return sendArcadeEmail({
    to,
    subject: `🏆 Tournament Alert: ${tournamentTitle}`,
    html,
    templateName: 'tournament_alert'
  });
}

