/**
 * Sidebar
 * Purpose: glass-strong navigation rail.
 * Used by: MainLayout.
 * Notes: section labels use .eyebrow; active item uses framer-motion layoutId pill.
 */
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useModuleSettings, type ModuleKey } from "@/hooks/useModuleSettings";
import autopilotLogo from "@/assets/autopilot-logo.png";
import {
  LayoutDashboard,
  Users,
  Calculator,
  DollarSign,
  FileText,
  Settings,
  Home,
  LogOut,
  Mail,
  Inbox,
  Lightbulb,
  UsersRound,
  Sparkles,
  FileSpreadsheet,
  KanbanSquare,
  Radar,
  Target,
  Plug,
} from "lucide-react";
import { toast } from "sonner";

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard; key: ModuleKey };

const navigation: NavItem[] = [
  { name: "Pipeline",          href: "/",                     icon: LayoutDashboard,   key: "pipeline" },
  { name: "Deals",             href: "/pipeline",             icon: KanbanSquare,      key: "deals" },
  { name: "Dashboard",         href: "/crm",                  icon: LayoutDashboard,   key: "crm" },
  { name: "Intent Signals",    href: "/signals",              icon: Radar,             key: "signals" },
  { name: "Intent Indicators", href: "/indicators",           icon: Target,            key: "indicators" },
  { name: "Integrations",      href: "/integrations",         icon: Plug,              key: "integrations" },
  { name: "Leads",             href: "/leads",                icon: Users,             key: "leads" },
  { name: "Properties",        href: "/properties",           icon: Home,              key: "properties" },
  { name: "Email Campaigns",   href: "/campaigns",            icon: Mail,              key: "campaigns" },
  { name: "Outbox",            href: "/outbox",               icon: Inbox,             key: "outbox" },
  { name: "Payroll",           href: "/payroll",              icon: FileSpreadsheet,   key: "payroll" },
  { name: "Intelligence",      href: "/intelligence",         icon: Lightbulb,         key: "intelligence" },
  { name: "Daily Briefs",      href: "/intelligence/briefs",  icon: Sparkles,          key: "briefs" },
  { name: "BD Team",           href: "/team",                 icon: UsersRound,        key: "team" },
];

const tools: NavItem[] = [
  { name: "Space Calculator",   href: "/tools/space",    icon: Calculator,  key: "tools.space" },
  { name: "Cost Analyzer",      href: "/tools/cost",     icon: DollarSign,  key: "tools.cost" },
  { name: "Brochure Generator", href: "/tools/brochure", icon: FileText,    key: "tools.brochure" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isEnabled } = useModuleSettings();

  const visibleNav = navigation.filter((n) => isEnabled(n.key));
  const visibleTools = tools.filter((n) => isEnabled(n.key));

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      navigate("/auth");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col">
      <div className="m-3 flex flex-1 flex-col overflow-hidden rounded-3xl glass-strong">
        {/* Brand */}
        <div className="flex h-[4.25rem] items-center justify-center border-b border-white/10 px-5">
          <img
            src={autopilotLogo}
            alt="Autopilot"
            className="h-9 w-auto object-contain"
            draggable={false}
          />
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          <div className="eyebrow mb-2 px-3 text-[10px]">Main</div>
          {visibleNav.map((item) => (
            <SideLink key={item.name} item={item} active={location.pathname === item.href} />
          ))}

          {visibleTools.length > 0 && (
            <>
              <div className="eyebrow mb-2 mt-6 px-3 text-[10px]">Tools</div>
              {visibleTools.map((item) => (
                <SideLink key={item.name} item={item} active={location.pathname === item.href} />
              ))}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/10 p-3">
          {user && (
            <div className="px-3 py-2">
              <p className="truncate text-[11px] text-foreground/55">{user.email}</p>
            </div>
          )}
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] text-foreground/70 transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] text-foreground/70 transition-colors hover:bg-critical/10 hover:text-critical"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

function SideLink({
  item,
  active,
}: {
  item: { name: string; href: string; icon: typeof LayoutDashboard };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.href}
      end={item.href === "/"}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
        active ? "text-foreground" : "text-foreground/65 hover:text-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl"
          style={{
            background: "oklch(1 0 0 / 10%)",
            boxShadow: "inset 0 1px 0 oklch(1 0 0 / 14%)",
          }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
      <Icon className="relative h-4 w-4" />
      <span className="relative">{item.name}</span>
    </NavLink>
  );
}
