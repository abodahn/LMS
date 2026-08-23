"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { NavIcon } from "@/components/nav-icon";
import { useT } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/navigation";

export function AdminNav({ items, title }: { items: NavItem[]; title: string }) {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const current = items.find((i) => isActive(i));

  const list = (
    <nav aria-label={title} className="space-y-0.5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item) ? "page" : undefined}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-2.5 rounded-[var(--radius-control)] px-3 py-2 text-[13px] font-medium transition-colors",
            isActive(item)
              ? "bg-[var(--brand-ink)] text-white"
              : "text-[var(--brand-charcoal)] hover:bg-[var(--brand-canvas)]",
          )}
        >
          <NavIcon name={item.icon} size={16} />
          {t(item.labelKey)}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-card)] border border-[var(--brand-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--brand-ink)]"
        >
          <span className="inline-flex items-center gap-2">
            {current ? <NavIcon name={current.icon} size={16} /> : null}
            {current ? t(current.labelKey) : title}
          </span>
          <ChevronDown size={16} className={cn("transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        {open ? <div className="card mt-2 p-2">{list}</div> : null}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <p className="section-title mb-2 px-3">{title}</p>
          {list}
        </div>
      </aside>
    </>
  );
}
