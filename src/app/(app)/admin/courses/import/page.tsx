import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { COURSE_IMPORT_COLUMNS } from "@/lib/import/courses";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { DownloadLink } from "@/components/download-link";
import { CourseImportWizard } from "./import-wizard";

export const metadata: Metadata = { title: "Import courses" };

/** The three the importer cannot proceed without. */
const REQUIRED_COLUMNS = new Set(["Code", "Title", "Provider"]);

/** Columns the recommendation engine actually reads. */
const ENGINE_COLUMNS = new Set([
  "Level",
  "Hours",
  "Competencies",
  "Departments",
  "Job Families",
  "Goals",
  "Language",
  "Prerequisites",
  "Technical",
]);

export default async function CourseImportPage() {
  await requirePermission("catalog.manage");
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/courses"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("admin.catalog")}
      </Link>

      <SectionHeading
        title={t("form.importCourses")}
        subtitle={t("form.importCoursesSubtitle")}
      />

      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("form.expectedColumns")}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--brand-muted)]">
          Only <strong>{t("form.code")}</strong>, <strong>{t("form.title")}</strong> and <strong>{t("form.provider")}</strong> are required, and Code is
          derived from the title if you leave it out. Column order does not matter, extra columns are ignored, and
          common alternative headings are recognised (<em>{t("form.link")}</em> for URL, <em>{t("form.duration")}</em> for Hours,{" "}
          <em>{t("form.partner")}</em> for Provider).
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {COURSE_IMPORT_COLUMNS.map((c) => (
            <li
              key={c}
              className={`rounded-full border px-2.5 py-1 text-[12px] ${
                REQUIRED_COLUMNS.has(c)
                  ? "border-[color-mix(in_srgb,var(--brand-red)_35%,transparent)] bg-[var(--brand-red-soft)] font-medium text-[var(--brand-red-dark)]"
                  : ENGINE_COLUMNS.has(c)
                    ? "border-[var(--brand-line)] font-medium text-[var(--brand-ink)]"
                    : "border-[var(--brand-line)] text-[var(--brand-muted)]"
              }`}
            >
              {c}
              {REQUIRED_COLUMNS.has(c) ? " *" : ""}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--brand-muted)]">
          The darker columns are the ones the recommendation engine reads. A course without a level, competencies and a
          department mapping still imports, but it will only ever be found by search — the engine has nothing to match
          it on. Multi-value columns accept commas, semicolons or pipes:{" "}
          <code className="font-mono">PROMPTING, WORKPLACE</code>.
        </p>
        <p className="mt-3 text-[12px] text-[var(--brand-muted)]">
          <DownloadLink href="/api/export/course-template" className="px-0 text-[var(--brand-red)] underline">
            {t("common.download")} template
          </DownloadLink>
        </p>
      </Card>

      <CourseImportWizard />
    </div>
  );
}
