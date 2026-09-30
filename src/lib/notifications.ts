// No `server-only`: runReminderRules is called by the scheduled job runner,
// which has no request around it.
import { prisma } from "./db";
import { sendMail } from "./mailer";
import { getDictionary, isLocale, localized, translate } from "./i18n";

export type NotificationInput = {
  category: "LEARNING" | "ASSESSMENT" | "CERTIFICATE" | "MANAGER" | "SYSTEM";
  title: string;
  body: string;
  link?: string;
  email?: boolean;
};

/**
 * A parameter that differs per language: a course or skill row, rendered in the
 * recipient's language through its Ar/Tr columns.
 */
export type LocalizedParam = { row: Record<string, unknown>; field: string };

/**
 * A notification written in the recipient's language, not the sender's.
 *
 * The text is stored already rendered, because a notification is a record of
 * what somebody was told — re-translating it later would change history. So the
 * language is decided here, from the person receiving it: a manager in Istanbul
 * approving a goal for an operator in Cairo sends that operator Arabic.
 *
 * Titles must differ per event where several can be unread at once (include the
 * course or skill in the title), because `notify` drops a second unread
 * notification with an identical title as a duplicate.
 */
export async function notifyTranslated(
  userId: string,
  input: {
    category: NotificationInput["category"];
    titleKey: string;
    bodyKey: string;
    params?: Record<string, string | number | LocalizedParam>;
    link?: string;
    email?: boolean;
  },
) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferredLanguage: true } });
  const preferred = user?.preferredLanguage;
  const locale = isLocale(preferred) ? preferred : "en";
  const dict = getDictionary(locale);

  const params: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(input.params ?? {})) {
    params[k] = typeof v === "object" ? localized(v.row, v.field, locale) : v;
  }

  return notify(userId, {
    category: input.category,
    title: translate(dict, input.titleKey, params),
    body: translate(dict, input.bodyKey, params),
    link: input.link,
    email: input.email,
  });
}

/**
 * In-app is the default channel; email is opt-in per notification. Duplicate
 * unread notifications with the same title are skipped so reminders never
 * stack up into spam.
 */
export async function notify(userId: string, input: NotificationInput) {
  const duplicate = await prisma.notification.findFirst({
    where: { userId, title: input.title, isRead: false },
  });
  if (duplicate) return duplicate;

  const created = await prisma.notification.create({
    data: {
      userId,
      category: input.category,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
    },
  });

  if (input.email) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, fullName: true } });
    if (user) {
      await sendMail({
        to: user.email,
        subject: input.title,
        text: `Hello ${user.fullName},\n\n${input.body}\n\n${process.env.APP_URL ?? "http://localhost:3000"}${input.link ?? "/"}`,
      });
    }
  }

  return created;
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markRead(userId: string, notificationId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

/**
 * Evaluates the configured reminder rules. Intended to be called from a
 * scheduled job (see docs/DEPLOYMENT.md) or the admin "run reminders" action.
 */
export async function runReminderRules() {
  const rules = await prisma.reminderRule.findMany({ where: { enabled: true } });
  let sent = 0;

  for (const rule of rules) {
    const cutoff = new Date(Date.now() - rule.thresholdDays * 86400000);

    if (rule.triggerType === "INACTIVITY") {
      const stale = await prisma.enrollment.findMany({
        where: { status: "IN_PROGRESS", lastAccessedAt: { lt: cutoff } },
        include: { course: true },
        take: 500,
      });
      for (const e of stale) {
        await notify(e.userId, {
          category: "LEARNING",
          title: "Your AI learning is waiting",
          body: rule.template.replace("{course}", e.course.title),
          link: `/learning/${e.id}`,
          email: rule.channel === "EMAIL",
        });
        sent++;
      }
    }

    if (rule.triggerType === "OVERDUE") {
      const overdue = await prisma.enrollment.findMany({
        where: { status: { in: ["NOT_STARTED", "IN_PROGRESS"] }, dueAt: { lt: new Date() } },
        include: { course: true },
        take: 500,
      });
      for (const e of overdue) {
        await notify(e.userId, {
          category: "LEARNING",
          title: `${e.course.title} is overdue`,
          body: rule.template.replace("{course}", e.course.title),
          link: `/learning/${e.id}`,
          email: rule.channel === "EMAIL",
        });
        sent++;
      }
    }

    if (rule.triggerType === "DUE_SOON") {
      const soon = new Date(Date.now() + rule.thresholdDays * 86400000);
      const due = await prisma.enrollment.findMany({
        where: { status: { in: ["NOT_STARTED", "IN_PROGRESS"] }, dueAt: { gte: new Date(), lte: soon } },
        include: { course: true },
        take: 500,
      });
      for (const e of due) {
        await notify(e.userId, {
          category: "LEARNING",
          title: `${e.course.title} is due soon`,
          body: rule.template
            .replace("{course}", e.course.title)
            .replace("{date}", e.dueAt?.toDateString() ?? ""),
          link: `/learning/${e.id}`,
          email: rule.channel === "EMAIL",
        });
        sent++;
      }
    }
  }

  return { sent };
}
