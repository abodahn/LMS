import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { AiCoachLauncher } from "@/components/coach/coach-launcher";
import { OfflineProvider } from "@/components/offline-provider";
import { EXPLORE_NAV, PRIMARY_NAV, ROLE_NAV, visibleNav } from "@/lib/navigation";
import { ROLE_META } from "@/lib/rbac";
import { getSetting } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const [unreadCount, coachEnabled] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    getSetting<boolean>(SETTING_KEYS.AI_ENABLED, false),
  ]);

  return (
    <AppShell
      user={{
        fullName: user.fullName,
        email: user.email,
        departmentName: user.departmentName,
        jobTitle: user.jobTitle,
        roleLabel: ROLE_META[user.role].name,
      }}
      primary={PRIMARY_NAV}
      explore={EXPLORE_NAV}
      role={visibleNav(ROLE_NAV, user.permissions)}
      unreadCount={unreadCount}
    >
      {/* Scoped to the signed-in area: the queue is keyed by user, and there is
          nothing to hold for somebody who has not signed in. */}
      <OfflineProvider userId={user.id}>
        {children}
        <AiCoachLauncher enabled={coachEnabled} />
      </OfflineProvider>
    </AppShell>
  );
}
