import { render } from "@react-email/components";
import { getResend } from "./client";
import { WelcomeEmail } from "./emails/welcome";
import { SetPasswordEmail } from "./emails/set-password";
import { PurchaseConfirmationEmail } from "./emails/purchase-confirmation";
import { RedeemCodeEmail } from "./emails/redeem-code";

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
  signInRequired: boolean;
}

export async function sendPurchaseConfirmationEmail({ to, productName, signInRequired }: SendPurchaseConfirmationEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const dashboardUrl = signInRequired
    ? `${appUrl}/sign-in?callbackUrl=/dashboard`
    : `${appUrl}/dashboard`;
  const html = await render(PurchaseConfirmationEmail({ productName, dashboardUrl }));

  return getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `Zakup potwierdzony — ${productName}`,
    html,
  });
}

interface SendRedeemCodeEmailParams {
  to: string;
  code: string;
  productName: string;
}

export async function sendRedeemCodeEmail({ to, code, productName }: SendRedeemCodeEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const signUpUrl = `${appUrl}/sign-up?code=${encodeURIComponent(code)}`;
  const html = await render(RedeemCodeEmail({ productName, code, signUpUrl }));

  return getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `Zakup potwierdzony — aktywuj dostęp do ${productName}`,
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
