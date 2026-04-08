import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "RipFly <onboarding@resend.dev>";

interface ReminderFlight {
  id: string;
  airlineName: string;
  flightNumber: string | null;
  origin: string | null;
  destination: string | null;
  pnr: string;
  flightDate: string | null;
  daysRemaining: number;
}

export async function sendReminderEmail(
  to: string,
  flight: ReminderFlight,
  isUrgent: boolean
) {
  const route =
    flight.origin && flight.destination
      ? `${flight.origin} → ${flight.destination}`
      : flight.airlineName;

  const subject = isUrgent
    ? `[Urgent] Only ${flight.daysRemaining} day left to claim miles for ${route}`
    : `${flight.daysRemaining} days left to claim miles for ${route}`;

  const appUrl = process.env.AUTH_URL ?? "https://ripfly.vercel.app";
  const claimLink = `${appUrl}/flights/${flight.id}`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
      <h2 style="margin: 0 0 4px 0; font-size: 18px;">
        ${isUrgent ? "⚠️ " : ""}Your miles are ${isUrgent ? "about to expire" : "expiring soon"}
      </h2>
      <p style="color: #666; margin: 0 0 24px 0; font-size: 14px;">
        You have <strong style="color: ${isUrgent ? "#dc2626" : "#ca8a04"};">${flight.daysRemaining} day${flight.daysRemaining !== 1 ? "s" : ""}</strong> left to claim loyalty miles.
      </p>

      <div style="border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">
          ${flight.airlineName}${flight.flightNumber ? ` ${flight.flightNumber}` : ""}
        </p>
        ${
          flight.origin && flight.destination
            ? `<p style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700;">${flight.origin} → ${flight.destination}</p>`
            : ""
        }
        <p style="margin: 0; font-size: 14px;">
          PNR: <strong style="font-family: monospace;">${flight.pnr}</strong>
          ${flight.flightDate ? ` · ${new Date(flight.flightDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
        </p>
      </div>

      <a href="${claimLink}" style="display: inline-block; background: #171717; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
        Claim Miles Now
      </a>

      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        Sent by RipFly · You're receiving this because you have unclaimed flight miles.
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
