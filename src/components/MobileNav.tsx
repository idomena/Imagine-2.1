import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Compass, TrendingUp, Plus, BarChart3, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function MobileNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const is = (p: string) => pathname === p;

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="bg-background/85 border-t border-border/60 backdrop-blur-2xl">
        <div className="relative mx-auto max-w-md grid grid-cols-5 items-center px-1 h-[62px]">

          <NavItem to="/" active={is("/")} icon={<Compass className="size-5" />} label="Discover" />
          <NavItem to="/trending" active={is("/trending")} icon={<TrendingUp className="size-5" />} label="Trending" />

          {/* Centre FAB */}
          <div className="flex justify-center">
            <Link
              to="/submit"
              aria-label="Submit a tool"
              className="grid place-items-center size-13 rounded-full bg-foreground text-background active:scale-95 transition-transform"
              style={{
                boxShadow:
                  "0 0 0 3px oklch(0.85 0.02 60), 0 8px 24px oklch(0.12 0.02 60 / 0.35), 0 1px 0 oklch(1 1 1 / 0.15) inset",
              }}
            >
              <Plus className="size-6" strokeWidth={2.75} />
            </Link>
          </div>

          <NavItem to="/dashboard" active={is("/dashboard")} icon={<BarChart3 className="size-5" />} label="Dashboard" />

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-1 h-full py-2 w-full"
            >
              <span className="flex items-center justify-center size-9 rounded-2xl text-foreground/45 hover:text-foreground/70 transition-all duration-150">
                <LogOut className="size-5" />
              </span>
              <span className="text-[9.5px] font-semibold tracking-wide leading-none text-foreground/45">
                Log out
              </span>
            </button>
          ) : (
            <NavItem to="/login" active={is("/login")} icon={<LogIn className="size-5" />} label="Log in" />
          )}
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  to,
  active,
  icon,
  label,
}: {
  to: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-1 h-full py-2"
    >
      <span
        className={`flex items-center justify-center size-9 rounded-2xl transition-all duration-150 ${
          active
            ? "bg-foreground/8 text-foreground scale-105"
            : "text-foreground/45 hover:text-foreground/70"
        }`}
      >
        {icon}
      </span>
      <span
        className={`text-[9.5px] font-semibold tracking-wide leading-none transition-colors ${
          active ? "text-foreground" : "text-foreground/45"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
