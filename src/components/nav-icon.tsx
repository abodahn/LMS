import {
  Award,
  BarChart3,
  Briefcase,
  Building2,
  ClipboardCheck,
  ClipboardList,
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
} as const;

export type IconName = keyof typeof ICONS;

export function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Cmp = ICONS[name as IconName] ?? Home;
  return <Cmp size={size} aria-hidden strokeWidth={1.9} />;
}
