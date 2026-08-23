import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ADMIN_NAV, visibleNav } from "@/lib/navigation";
import { getI18n } from "@/lib/locale";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  const items = visibleNav(ADMIN_NAV, user.permissions);
  // Anyone without a single administration permission never sees this shell.
  if (items.length <= 1 && !user.permissions.includes("users.view")) redirect("/no-access");
  const { dict } = await getI18n();

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <AdminNav items={items} title={dict.admin.title} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
