import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/primitives";
import { CourseForm } from "../course-form";
import { emptyCourseValues, loadCourseFormOptions } from "../course-data";
import { aiAvailable } from "@/lib/ai/provider";

export const metadata: Metadata = { title: "New course" };

export default async function NewCoursePage() {
  await requirePermission("catalog.manage");
  const { dict, locale } = await getI18n();
  const t = (k: string) => translate(dict, k);
  const [options, aiEnabled] = await Promise.all([loadCourseFormOptions(locale), aiAvailable()]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/courses"
        className="text-[13px] font-medium text-[var(--brand-muted)] underline-offset-4 hover:text-[var(--brand-ink)] hover:underline"
      >
        ← {t("admin.catalog")}
      </Link>
      <SectionHeading title={t("common.create")} subtitle={t("admin.catalog")} />
      <CourseForm values={emptyCourseValues(options.providers[0]?.id ?? "")} {...options} prerequisites={[]} aiEnabled={aiEnabled} />
    </div>
  );
}
