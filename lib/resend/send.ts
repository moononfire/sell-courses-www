import { render } from "@react-email/components";
import { getResend } from "./client";
import { WelcomeEmail } from "./emails/welcome";
import { SetPasswordEmail } from "./emails/set-password";
import { PurchaseConfirmationEmail } from "./emails/purchase-confirmation";

interface SendWelcomeEmailParams {
  to: string;
  name?: string;
}

export async function sendWelcomeEmail({ to, name }: SendWelcomeEmailParams) {
  const html = await render(WelcomeEmail({ name }));

  return getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: "Welcome!",
    html,
  });
}

interface SendSetPasswordEmailParams {
  to: string;
  token: string;
  productName: string;
}

interface SendPurchaseConfirmationEmailParams {
  to: string;
  productName: string;
}

export async function sendPurchaseConfirmationEmail({ to, productName }: SendPurchaseConfirmationEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const dashboardUrl = `${appUrl}/dashboard`;
  const html = await render(PurchaseConfirmationEmail({ productName, dashboardUrl }));

  return getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `Zakup potwierdzony — ${productName}`,
    html,
  });
}

export async function sendSetPasswordEmail({ to, token, productName }: SendSetPasswordEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const setPasswordUrl = `${appUrl}/set-password?token=${token}`;
  const html = await render(SetPasswordEmail({ setPasswordUrl, productName }));

  return getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: "Zakup potwierdzony — ustaw hasło",
    html,
  });
}
