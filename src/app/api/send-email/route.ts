import { NextResponse } from 'next/server';
import { sendArcadeEmail, sendTournamentAlertEmail } from '@/lib/resend/email';

export async function POST(req: Request) {
  try {
    const { to, subject, html, templateName, tournamentTitle, prizePool, userId } = await req.json();

    if (!to) {
      return NextResponse.json({ error: 'Recipient email required' }, { status: 400 });
    }

    if (templateName === 'tournament_alert') {
      const result = await sendTournamentAlertEmail(to, tournamentTitle || 'Lagos Street Derby', prizePool || '₦250,000');
      return NextResponse.json(result);
    }

    const result = await sendArcadeEmail({
      to,
      subject: subject || 'Naija Street Arcade Notification',
      html: html || '<p>You have a new arcade notification.</p>',
      templateName: templateName || 'general_notification',
      userId
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
