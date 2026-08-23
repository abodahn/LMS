"use client";

import { useState, useTransition } from "react";
import { ClipboardCheck, Ban } from "lucide-react";
import { Alert, Card, StatusPill, TableShell } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { FormSuccess } from "@/components/ui/form";
import { useT } from "@/components/i18n-provider";
import { markAttendanceAction, cancelSessionAction } from "./actions";

export type RosterRow = {
  userId: string;
  name: string;
  employeeCode: string;
  department: string | null;
  status: string;
  waitlistOrder: number | null;
};

/**
 * The register, and the two things done with it.
 *
 * Attendance starts from what is already recorded rather than from blank, so
 * re-opening the register after a correction does not silently mark everybody
 * absent. Only people holding a seat are markable — a waiting-list entry is not
 * an attendance question.
 */
export function Roster({
  sessionId,
  rows,
  cancelled,
  linkedCourse,
}: {
  sessionId: string;
  rows: RosterRow[];
  cancelled: boolean;
  linkedCourse: string | null;
}) {
  const t = useT();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);

  const seated = rows.filter((r) => r.status !== "CANCELLED" && r.status !== "WAITLISTED");
  const [present, setPresent] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(seated.map((r) => [r.userId, r.status === "ATTENDED"])),
  );

  const waitlist = rows.filter((r) => r.status === "WAITLISTED");

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[var(--brand-ink)]">
          <ClipboardCheck size={17} className="text-[var(--brand-red)]" aria-hidden />
          {t("sessions.roster")}
        </h2>
        <p className="mt-1 text-[13px] text-[var(--brand-muted)]">
          {linkedCourse ? t("sessions.attendanceHint") : t("sessions.noCourse")}
        </p>

        {seated.length === 0 ? (
          <p className="mt-4 text-[13px] text-[var(--brand-muted)]">{t("common.noResults")}</p>
        ) : (
          <>
            <TableShell>
              <table className="data-table mt-4">
                <thead>
                  <tr>
                    <th>{t("common.name")}</th>
                    <th>{t("common.department")}</th>
                    <th>{t("common.status")}</th>
                    <th className="text-end">{t("sessions.attended")}</th>
                  </tr>
                </thead>
                <tbody>
                  {seated.map((r) => (
                    <tr key={r.userId}>
                      <td>
                        <span className="font-medium text-[var(--brand-ink)]">{r.name}</span>
                        <span className="ms-2 text-[12px] text-[var(--brand-muted)]">{r.employeeCode}</span>
                      </td>
                      <td>{r.department ?? "—"}</td>
                      <td>
                        <StatusPill status={r.status} />
                      </td>
                      <td className="text-end">
                        <input
                          type="checkbox"
                          checked={present[r.userId] ?? false}
                          disabled={pending || cancelled}
                          onChange={(e) => setPresent((p) => ({ ...p, [r.userId]: e.target.checked }))}
                          aria-label={`${r.name} — ${t("sessions.attended")}`}
                          className="h-4 w-4 accent-[var(--brand-red)]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableShell>

            <div className="mt-4 flex items-center gap-3">
              <Button
                disabled={pending || cancelled}
                onClick={() =>
                  start(async () => {
                    const result = await markAttendanceAction(
                      sessionId,
                      seated.map((r) => ({ userId: r.userId, attended: present[r.userId] ?? false })),
                    );
                    setMessage(result.success ? t(result.success) : "");
                  })
                }
              >
                {pending ? t("common.saving") : t("sessions.markAttendance")}
              </Button>
              <FormSuccess>{message}</FormSuccess>
            </div>
          </>
        )}

        {waitlist.length > 0 ? (
          <div className="mt-5">
            <h3 className="section-title">{t("sessions.waitlisted")}</h3>
            <ul className="mt-2 space-y-1 text-[13px] text-[var(--brand-muted)]">
              {waitlist.map((r) => (
                <li key={r.userId}>
                  {r.waitlistOrder}. {r.name} · {r.employeeCode}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      {!cancelled ? (
        <Card className="p-5">
          <h2 className="inline-flex items-center gap-2 text-base font-semibold text-[var(--brand-ink)]">
            <Ban size={17} className="text-[var(--brand-red)]" aria-hidden />
            {t("sessions.cancelSession")}
          </h2>
          <p className="mt-1 text-[13px] text-[var(--brand-muted)]">{t("sessions.cancelHint")}</p>

          <label className="mt-3 block text-[13px]">
            <span className="label">{t("sessions.cancelReason")}</span>
            <textarea
              rows={2}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="field"
            />
          </label>

          {confirming ? (
            <div className="mt-3">
              <Alert tone="warning">{t("sessions.cancelHint")}</Alert>
              <div className="mt-3 flex gap-2">
                <Button
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await cancelSessionAction(sessionId, reason);
                      setConfirming(false);
                    })
                  }
                >
                  {t("common.confirm")}
                </Button>
                <Button variant="secondary" onClick={() => setConfirming(false)}>
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" className="mt-3" onClick={() => setConfirming(true)}>
              {t("sessions.cancelSession")}
            </Button>
          )}
        </Card>
      ) : null}
    </div>
  );
}
