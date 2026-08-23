import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Lightbulb, NotebookPen } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getI18n } from "@/lib/locale";
import { translate, localized } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { Card, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { CopyButton } from "@/components/copy-button";
import { DeleteToolboxItem } from "./delete-button";
import { AddPromptForm } from "./add-prompt-form";

export const metadata: Metadata = { title: "My AI Toolbox" };

export default async function ToolboxPage() {
  const user = await requireUser();
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);

  const [prompts, bookmarks, notes] = await Promise.all([
    prisma.savedPrompt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.useCaseBookmark.findMany({
      where: { userId: user.id },
      include: { useCase: { include: { department: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userNote.findMany({
      where: { userId: user.id },
      include: { course: true, lesson: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const empty = prompts.length === 0 && bookmarks.length === 0 && notes.length === 0;

  return (
    <div className="space-y-6">
      <SectionHeading title={t("toolbox.title")} />

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("toolbox.savePrompt")}</h2>
        <div className="mt-4">
          <AddPromptForm />
        </div>
      </Card>

      {empty ? (
        <EmptyState
          title={t("toolbox.empty")}
          body={t("toolbox.emptyBody")}
          icon={<Briefcase size={20} />}
          action={
            <Link
              href="/prompts"
              className="inline-flex h-10 items-center rounded-[var(--radius-control)] bg-[var(--brand-red)] px-4 text-sm font-semibold text-white hover:bg-[var(--brand-red-dark)]"
            >
              {t("prompts.title")}
            </Link>
          }
        />
      ) : null}

      {prompts.length > 0 ? (
        <section>
          <h2 className="section-title mb-3">{t("toolbox.myPrompts")}</h2>
          <ul className="grid gap-3">
            {prompts.map((p) => (
              <li key={p.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-[15px] font-semibold text-[var(--brand-ink)]">{p.title}</h3>
                    <span className="text-[12px] text-[var(--brand-muted)]">{formatDate(p.createdAt, locale)}</span>
                  </div>
                  <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-[var(--radius-control)] bg-[var(--brand-canvas)] p-4 font-mono text-[12.5px] leading-relaxed text-[var(--brand-charcoal)]">
                    {p.body}
                  </pre>
                  {p.notes ? <p className="mt-2 text-[13px] text-[var(--brand-muted)]">{p.notes}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <CopyButton text={p.body} />
                    <DeleteToolboxItem id={p.id} kind="prompt" label={t("common.delete")} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bookmarks.length > 0 ? (
        <section>
          <h2 className="section-title mb-3">{t("toolbox.savedUseCases")}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {bookmarks.map((b) => (
              <li key={b.id}>
                <Card className="flex h-full flex-col p-5">
                  <Lightbulb size={18} className="text-[var(--brand-red)]" aria-hidden />
                  <h3 className="mt-2 text-[15px] font-semibold text-[var(--brand-ink)]">
                    {localized(b.useCase, "title", locale)}
                  </h3>
                  <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
                    {b.useCase.department ? localized(b.useCase.department, "name", locale) : ""}
                  </p>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[var(--brand-charcoal)]">
                    {b.useCase.problem}
                  </p>
                  <div className="mt-auto flex gap-2 pt-3">
                    <Link
                      href="/use-cases"
                      className="inline-flex h-9 items-center rounded-[var(--radius-control)] border border-[var(--brand-line)] px-3 text-[13px] font-semibold text-[var(--brand-ink)] hover:bg-[var(--brand-canvas)]"
                    >
                      {t("common.view")}
                    </Link>
                    <DeleteToolboxItem id={b.id} kind="bookmark" label={t("common.remove")} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {notes.length > 0 ? (
        <section>
          <h2 className="section-title mb-3">{t("toolbox.myNotes")}</h2>
          <ul className="grid gap-3">
            {notes.map((n) => (
              <li key={n.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--brand-ink)]">
                      <NotebookPen size={15} className="text-[var(--brand-muted)]" aria-hidden />
                      {n.title}
                    </h3>
                    <span className="text-[12px] text-[var(--brand-muted)]">
                      {n.course ? localized(n.course, "title", locale) : ""} · {formatDate(n.updatedAt, locale)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--brand-charcoal)]">
                    {n.body}
                  </p>
                  <div className="mt-3">
                    <DeleteToolboxItem id={n.id} kind="note" label={t("common.delete")} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
