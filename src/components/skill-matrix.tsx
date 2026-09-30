import { localized, translate, type Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/constants";
import type { SkillGap } from "@/lib/skills";
import { MAX_LEVEL } from "@/lib/skills";
import { Card } from "@/components/ui/primitives";

/**
 * Required against held, per skill.
 *
 * The bar shows the requirement as the track and what the person holds as the
 * fill, so a gap is the empty part rather than a number to interpret. Both
 * numbers are printed beside it anyway: this ends up in a conversation between
 * two people about one of them, and a picture nobody can check is not a good
 * basis for that conversation.
 */
function LevelBar({ required, held, critical }: { required: number; held: number; critical: boolean }) {
  const cells = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1);
  return (
    <span className="flex gap-[3px]" aria-hidden>
      {cells.map((level) => {
        const filled = level <= held;
        const wanted = level <= required;
        return (
          <span
            key={level}
            className="h-2 w-4 rounded-[2px] border"
            style={{
              background: filled
                ? critical && held < required
                  ? "var(--brand-red)"
                  : "var(--brand-ink)"
                : "transparent",
              borderColor: wanted ? "var(--brand-ink)" : "var(--brand-line)",
              opacity: wanted || filled ? 1 : 0.35,
            }}
          />
        );
      })}
    </span>
  );
}

export function SkillRow({
  gap,
  dict,
  locale,
  action,
}: {
  gap: SkillGap;
  dict: Dictionary;
  locale: Locale;
  action?: React.ReactNode;
}) {
  const t = (k: string) => translate(dict, k);
  const name = localized(gap, "name", locale);

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[var(--brand-line)] py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-[var(--brand-ink)]">{name}</span>
          {gap.isCritical && gap.gap > 0 ? (
            <span className="rounded-[3px] bg-[var(--brand-red-soft)] px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-[var(--brand-red)]">
              {t("skills.critical")}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[12px] text-[var(--brand-muted)]">
          {t("skills.category." + gap.category)}
          {" · "}
          {gap.source ? t("skills.source." + gap.source) : t("skills.notRated")}
          {gap.ratedBy ? ` · ${t("skills.ratedBy")} ${gap.ratedBy}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <LevelBar required={gap.required} held={gap.held} critical={gap.isCritical} />
        <span className="w-24 text-[12px] tabular-nums text-[var(--brand-muted)]">
          {gap.held} / {gap.required}
        </span>
        {action}
      </div>
    </li>
  );
}

/**
 * The whole matrix: what is missing first, what is already there after it.
 *
 * Gaps lead because that is what anyone opens this for, but the met
 * requirements stay on the page — a screen that only ever lists shortcomings is
 * one people learn to avoid opening.
 */
export function SkillMatrix({
  profile,
  dict,
  locale,
  renderAction,
}: {
  profile: { gaps: SkillGap[]; met: SkillGap[]; readiness: number | null; criticalGaps: number; jobTitle: string | null };
  dict: Dictionary;
  locale: Locale;
  renderAction?: (gap: SkillGap) => React.ReactNode;
}) {
  const t = (k: string) => translate(dict, k);

  if (!profile.jobTitle) {
    return (
      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("skills.matrix")}</h2>
        <p className="mt-2 text-sm text-[var(--brand-muted)]">{t("skills.noJobTitle")}</p>
      </Card>
    );
  }

  const total = profile.gaps.length + profile.met.length;
  if (total === 0) {
    return (
      <Card className="p-5">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("skills.matrix")}</h2>
        <p className="mt-2 text-sm text-[var(--brand-muted)]">{t("skills.noRequirements")}</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--brand-ink)]">{t("skills.matrix")}</h2>
        <p className="text-[13px] text-[var(--brand-muted)]">
          {profile.jobTitle}
          {profile.readiness !== null ? ` · ${Math.round(profile.readiness * 100)}% ${t("skills.readiness")}` : ""}
        </p>
      </div>

      {profile.gaps.length > 0 ? (
        <>
          <h3 className="mt-4 text-[12px] font-medium uppercase tracking-wide text-[var(--brand-muted)]">
            {t("skills.gapsFound")} ({profile.gaps.length})
          </h3>
          <ul className="mt-1">
            {profile.gaps.map((g) => (
              <SkillRow key={g.skillId} gap={g} dict={dict} locale={locale} action={renderAction?.(g)} />
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-3 text-sm text-[var(--brand-muted)]">{t("skills.allMet")}</p>
      )}

      {profile.met.length > 0 ? (
        <>
          <h3 className="mt-6 text-[12px] font-medium uppercase tracking-wide text-[var(--brand-muted)]">
            {t("skills.strengths")} ({profile.met.length})
          </h3>
          <ul className="mt-1">
            {profile.met.map((g) => (
              <SkillRow key={g.skillId} gap={g} dict={dict} locale={locale} action={renderAction?.(g)} />
            ))}
          </ul>
        </>
      ) : null}
    </Card>
  );
}
