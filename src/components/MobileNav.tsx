import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, TrendingUp, Plus, BarChart3, User as UserIcon, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function MobileNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, isAuthenticated } = useAuth();
  const is = (p: string) => pathname === p;

  const avatarEl = isAuthenticated && user ? (
    user.avatarUrl
      ? (
        <img
          src={user.avatarUrl}
          alt=""
          className="size-7 rounded-full object-cover ring-2 ring-background"
        />
      )
      : (() => {
          const name = user.displayName ?? user.email;
          const hue = name.split("").reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
          return (
            <span
              className="grid place-items-center size-7 rounded-full text-[11px] font-bold text-white ring-2 ring-background"
              style={{ background: `oklch(0.65 0.18 ${hue})` }}
            >
              {name.slice(0, 2).toUpperCase()}
            </span>
          );
        })()
  ) : <UserIcon className="size-5" />;

  const youActive = pathname.startsWith("/u/") || is("/dashboard");

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      {/* frosted glass bar */}
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
            <NavItem
              to="/dashboard"
              active={youActive}
              icon={avatarEl}
              label="You"
            />
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
