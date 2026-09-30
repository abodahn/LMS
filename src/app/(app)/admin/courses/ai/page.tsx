import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { aiAvailable } from "@/lib/ai/provider";
import { getI18n } from "@/lib/locale";
import { translate } from "@/lib/i18n";
import { SectionHeading } from "@/components/ui/primitives";
import { CourseBuilderForm } from "../ai-tools";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: translate(dict, "ai.draftCourse") };
}

export default async function AiCourseBuilderPage() {
  await requirePermission("catalog.manage");
  // Without a configured provider there is nothing to press; back to the list
  // rather than a form that can only fail.
  if (!(await aiAvailable())) redirect("/admin/courses");
  const { dict } = await getI18n();
  const t = (k: string) => translate(dict, k);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--brand-muted)] hover:text-[var(--brand-ink)]"
      >
        <ArrowLeft size={14} className="rtl:rotate-180" aria-hidden />
        {t("admin.catalog")}
      </Link>
      <SectionHeading title={t("ai.draftCourse")} subtitle={t("ai.builderIntro")} />
      <CourseBuilderForm />
    </div>
  );
}
