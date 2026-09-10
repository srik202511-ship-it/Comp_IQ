import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard, Building2, GitCompare, Lightbulb, Grid2X2, Settings,
  LogOut, Radar as RadarIcon, Menu, X, Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import Onboarding from "./Onboarding";

const NAV = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/competitors", label: "Competitors", Icon: Building2 },
  { to: "/compare", label: "Compare", Icon: GitCompare },
  { to: "/insights", label: "AI Insights", Icon: Lightbulb },
  { to: "/swot", label: "SWOT Matrix", Icon: Grid2X2 },
  { to: "/settings", label: "Settings", Icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { company, competitors, onboardingOpen, setOnboardingOpen, openOnboarding } = useData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const analyzed = competitors.filter((c) => c.status === "Analyzed").length;

  const Sidebar = (
    <div className="flex flex-col h-full justify-between p-4">
      <div>
        <div className="flex items-center gap-2.5 px-2 py-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <RadarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-heading font-bold text-slate-50 leading-none">CompeteIQ</div>
            <div className="font-mono text-[10px] text-slate-500 tracking-wider mt-1">COMPETITIVE INTEL</div>
          </div>
        </div>
        <nav className="space-y-1">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-[#1F2937] border border-transparent"
                }`
              }
            >
              <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="space-y-3">
        <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Analyzed</div>
          <div className="text-slate-100 font-heading font-bold text-lg">{analyzed} / {competitors.length}</div>
          <div className="text-[11px] text-slate-500">competitors</div>
        </div>
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-slate-200 text-xs font-medium truncate">{user?.name || user?.email}</div>
            <div className="text-slate-500 text-[10px] truncate">{user?.email}</div>
          </div>
          <button onClick={logout} data-testid="logout-btn" className="text-slate-500 hover:text-rose-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F17]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 bg-[#0B0F17] border-r border-[#1f2937] z-40">
        {Sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-[#0B0F17] border-r border-[#1f2937]">{Sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top header */}
        <header className="h-16 bg-[#0B0F17]/80 backdrop-blur-md border-b border-[#1f2937] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-300" onClick={() => setMobileOpen(true)} data-testid="mobile-menu-btn">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <div className="text-slate-100 font-heading font-semibold text-sm sm:text-base">{company?.company_name || "Your Company"}</div>
              <div className="font-mono text-[10px] text-slate-500 tracking-wider uppercase">{company?.industry || "—"} · vs {competitors.length} competitors</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {company?.is_demo && (
              <button onClick={openOnboarding} data-testid="open-setup-guide"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-[11px] font-medium hover:bg-blue-500/20 transition-colors">
                <Sparkles className="w-3 h-3" /> Setup Guide
              </button>
            )}
            {company?.is_demo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Demo Data
              </span>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-[1500px]">
          <Outlet />
        </main>
      </div>

      {onboardingOpen && <Onboarding onClose={() => setOnboardingOpen(false)} />}
    </div>
  );
}
