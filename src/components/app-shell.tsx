"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { NavIcon } from "./nav-icon";
import { LocaleSwitcher } from "./locale-switcher";
import { useT } from "./i18n-provider";
import { clearServiceWorkerCaches } from "./service-worker";
import { clearOfflineQueue } from "@/lib/offline-sync";
import { Logo } from "./brand";
import { cn, initials } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation";
import { logoutAction } from "@/app/(auth)/actions";

type ShellUser = {
  fullName: string;
  email: string;
  departmentName: string | null;
  jobTitle: string | null;
  roleLabel: string;
};

export function AppShell({
  user,
  primary,
  explore,
  role,
  unreadCount,
  children,
}: {
  user: ShellUser;
  primary: NavItem[];
  explore: NavItem[];
  role: NavItem[];
  unreadCount: number;
  children: ReactNode;
}) {
  const t = useT();
  const pathname = usePathname();
  // The drawer belongs to one route: navigating anywhere closes it, with no
  // effect and no second render.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const menuOpen = openedFor === pathname;
  const setMenuOpen = (open: boolean) => setOpenedFor(open ? pathname : null);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const navLink = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={isActive(item) ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-[13.5px] font-medium transition-colors",
        isActive(item)
          ? "bg-[var(--brand-red-soft)] font-semibold text-[var(--brand-red-dark)]"
          : "text-[var(--brand-charcoal)] hover:bg-[color-mix(in_srgb,var(--brand-line)_45%,transparent)]",
      )}
    >
      {isActive(item) ? (
        <span
          className="absolute inset-y-1.5 start-0 w-[3px] rounded-e-full bg-[var(--brand-red-logo)]"
          aria-hidden
        />
      ) : null}
      <span className={cn(isActive(item) ? "text-[var(--brand-red)]" : "text-[var(--brand-muted)]")}>
        <NavIcon name={item.icon} />
      </span>
      {t(item.labelKey)}
    </Link>
  );

  const sidebarBody = (
    <>
      <nav aria-label={t("nav.mainMenu")} className="space-y-1">
        {primary.map(navLink)}
      </nav>

      {role.length > 0 ? <nav className="mt-6 space-y-1 border-t border-[var(--brand-line)] pt-5">{role.map(navLink)}</nav> : null}

      {explore.length > 0 ? (
        <div className="mt-6 border-t border-[var(--brand-line)] pt-5">
          <p className="section-title mb-2 px-3">{t("nav.explore")}</p>
          <nav className="space-y-1">{explore.map(navLink)}</nav>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[var(--brand-ink)] focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        {t("nav.skipToContent")}
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-[var(--brand-line)] bg-[var(--brand-canvas)] lg:flex">
        <div className="px-5 py-5">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">{sidebarBody}</div>
        <UserBlock user={user} t={t} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[var(--brand-line)] bg-[color-mix(in_srgb,var(--brand-canvas)_88%,white)]/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t("nav.mainMenu")}
          className="rounded-[var(--radius-control)] p-2 text-[var(--brand-charcoal)] hover:bg-[var(--brand-canvas)]"
        >
          <Menu size={20} />
        </button>
        <Logo variant="mark" />
        <NotificationBell count={unreadCount} label={t("nav.notifications")} />
      </header>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[var(--brand-ink)]/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 start-0 flex w-[280px] max-w-[85vw] flex-col bg-[var(--brand-canvas)] shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between px-4 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={t("common.close")}
                className="rounded-[var(--radius-control)] p-2 text-[var(--brand-charcoal)] hover:bg-[var(--brand-canvas)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4">{sidebarBody}</div>
            <UserBlock user={user} t={t} />
          </div>
        </div>
      ) : null}

      <div className="lg:ps-64">
        {/* Desktop header strip */}
        <div className="sticky top-0 z-20 hidden items-center justify-end gap-3 border-b border-[var(--brand-line)] bg-[color-mix(in_srgb,var(--brand-canvas)_88%,white)]/85 px-6 py-2.5 backdrop-blur-md lg:flex">
          <LocaleSwitcher />
          <NotificationBell count={unreadCount} label={t("nav.notifications")} />
        </div>
        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function NotificationBell({ count, label }: { count: number; label: string }) {
  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `${label} (${count})` : label}
      className="relative rounded-[var(--radius-control)] p-2 text-[var(--brand-charcoal)] hover:bg-[var(--brand-canvas)]"
    >
      <Bell size={19} strokeWidth={1.9} />
      {count > 0 ? (
        <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-red)] px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}

function UserBlock({ user, t }: { user: ShellUser; t: (k: string) => string }) {
  return (
    <div className="border-t border-[var(--brand-line)] p-3">
      <div className="flex items-center gap-3 rounded-[var(--radius-control)] px-2 py-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-ink)] text-[13px] font-semibold text-white">
          {initials(user.fullName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-[var(--brand-ink)]">
            {user.fullName}
          </span>
          <span className="block truncate text-[12px] text-[var(--brand-muted)]">
            {user.jobTitle ?? user.roleLabel}
          </span>
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 px-1 lg:hidden">
        <LocaleSwitcher compact />
      </div>
      <form
        action={logoutAction}
        className="mt-1"
        // These phones get handed between shifts. Nothing of this person's is
        // left behind for the next one — not the cached assets, and not the
        // queue of work still waiting to be sent.
        onSubmit={() => {
          void clearOfflineQueue().catch(() => {});
          void clearServiceWorkerCaches().catch(() => {});
        }}
      >
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium text-[var(--brand-charcoal)] transition-colors hover:bg-[var(--brand-canvas)]"
        >
          <LogOut size={18} strokeWidth={1.9} className="text-[var(--brand-muted)]" />
          {t("nav.signOut")}
        </button>
      </form>
    </div>
  );
}
