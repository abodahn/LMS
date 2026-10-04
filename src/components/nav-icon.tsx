import {
  Trophy,
  Webhook,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  CalendarDays,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Cpu,
  FileSpreadsheet,
  GraduationCap,
  Home,
  IdCard,
  LayoutDashboard,
  Library,
  Lightbulb,
  ListChecks,
  MessageSquareQuote,
  Route,
  ScrollText,
  Settings,
  Sparkles,
  Target,
  User,
  UserCheck,
  Users,
} from "lucide-react";

const ICONS = {
  home: Home,
  "graduation-cap": GraduationCap,
  "clipboard-check": ClipboardCheck,
  "clipboard-list": ClipboardList,
  award: Award,
  user: User,
  users: Users,
  "user-check": UserCheck,
  settings: Settings,
  library: Library,
  lightbulb: Lightbulb,
  "message-square-quote": MessageSquareQuote,
  briefcase: Briefcase,
  "id-card": IdCard,
  "layout-dashboard": LayoutDashboard,
  "building-2": Building2,
  route: Route,
  "list-checks": ListChecks,
  sparkles: Sparkles,
  "bar-chart-3": BarChart3,
  "file-spreadsheet": FileSpreadsheet,
  target: Target,
  "scroll-text": ScrollText,
  calendar: Calendar,
  "calendar-days": CalendarDays,
  cpu: Cpu,
  trophy: Trophy,
  webhook: Webhook,
} as const;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES: string[] = Object.keys(ICONS);

/**
 * The fallback is Home rather than nothing so a typo never leaves a hole in the
 * menu — which is also why a missing name goes unnoticed. `navIconsResolve` in
 * the tests checks every nav entry against this map for exactly that reason:
 * "calendar-days" shipped without an entry and showed a house for weeks.
 */
export function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Cmp = ICONS[name as IconName] ?? Home;
  return <Cmp size={size} aria-hidden strokeWidth={1.9} />;
}
