// No `server-only`: reminder mail is sent by the scheduled job runner, which
// has no request around it.
import { prisma } from "./db";
import { parseJson } from "./utils";

export type MailInput = { to: string; subject: string; text: string; html?: string };

/**
 * SMTP transport is configured through Admin → Integrations. Until it is
 * enabled, mail is written to the server log rather than silently dropped, so
 * password-reset links still work in a local deployment.
 *
 * ponytail: log transport by default. Swap in nodemailer here when the
 * organisation supplies SMTP credentials — the call sites do not change.
 */
export async function sendMail(input: MailInput): Promise<{ delivered: boolean; via: string }> {
  const integration = await prisma.integration.findUnique({ where: { key: "smtp" } }).catch(() => null);

  if (!integration?.enabled) {
    console.info(`[mail:console] to=${input.to} subject=${input.subject}\n${input.text}`);
    return { delivered: false, via: "console" };
  }

  const config = parseJson<{ host?: string; port?: number; user?: string; from?: string }>(
    integration.config,
    {},
  );

  try {
    // nodemailer is an optional dependency: present only where SMTP is used.
    const mod = await import("nodemailer").catch(() => null);
    if (!mod) {
      console.warn("[mail] SMTP enabled but nodemailer is not installed; falling back to console.");
      console.info(`[mail:console] to=${input.to} subject=${input.subject}\n${input.text}`);
      return { delivered: false, via: "console" };
    }
    const transport = mod.createTransport({
      host: config.host,
      port: config.port ?? 587,
      auth: config.user ? { user: config.user, pass: process.env.SMTP_PASSWORD ?? "" } : undefined,
    });
    await transport.sendMail({
      from: config.from ?? "no-reply@tcgarments.com",
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { delivered: true, via: "smtp" };
  } catch (err) {
    console.error("[mail] delivery failed", err instanceof Error ? err.message : err);
    return { delivered: false, via: "error" };
  }
}
