import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Compass, TrendingUp, Plus, BarChart3, User as UserIcon, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function MobileNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const is = (p: string) => pathname === p;

  const handleLogout = async () => {
    await logout();
    router.navigate({ to: "/" });
  };

  const avatarEl = isAuthenticated && user ? (
    user.avatarUrl
      ? <img src={user.avatarUrl} alt="" className="size-6 rounded-full object-cover sticker" />
      : (() => {
          const name = user.displayName ?? user.email;
          const hue = name.split("").reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
          return (
            <span
              className="grid place-items-center size-6 rounded-full text-[10px] font-bold text-white sticker"
              style={{ background: `oklch(0.65 0.18 ${hue})` }}
            >
              {name.slice(0, 2).toUpperCase()}
            </span>
          );
        })()
  ) : <UserIcon className="size-5" />;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] bg-background/90 border-t border-border backdrop-blur-xl"
      aria-label="Primary"
    >
      <div className="relative mx-auto max-w-md grid grid-cols-5 items-end px-2 pt-1">
        <Item to="/" active={is("/")} icon={<Compass className="size-5" />} label="Discover" />
        <Item to="/trending" active={is("/trending")} icon={<TrendingUp className="size-5" />} label="Trending" />

        <div className="flex justify-center -mt-7">
          <Link
            to="/submit"
            aria-label="Submit a tool"
            className="grid place-items-center size-14 rounded-full bg-primary text-foreground sticker active:scale-95 transition"
            style={{ boxShadow: "0 12px 28px oklch(0.22 0.03 60 / 0.25), 0 1px 0 oklch(1 1 1 / 0.25) inset" }}
          >
            <Plus className="size-6" strokeWidth={2.75} />
          </Link>
        </div>

        <Item to="/dashboard" active={is("/dashboard")} icon={<BarChart3 className="size-5" />} label="Dashboard" />

        {isAuthenticated ? (
          <div className="flex flex-col items-center gap-0.5 py-2 relative">
            {pathname.startsWith("/u/") || is("/dashboard") ? (
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-primary" />
            ) : null}
            <Link
              to="/dashboard"
              className="flex flex-col items-center gap-0.5 text-[10px] font-semibold tracking-wide transition text-foreground/55 hover:text-foreground"
            >
              {avatarEl}
              <span>You</span>
            </Link>
            <button
              onClick={handleLogout}
              className="absolute -top-1 -right-1 grid place-items-center size-5 rounded-full bg-card border border-border text-foreground/60 hover:text-foreground transition"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="size-3" />
            </button>
          </div>
        ) : (
          <Item to="/login" active={is("/login")} icon={<LogIn className="size-5" />} label="Log in" />
        )}
      </div>
    </nav>
  );
}

function Item({
  to,
  params,
  active,
  icon,
  label,
  founder,
}: {
  to: string;
  params?: Record<string, string>;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  founder?: boolean;
}) {
  const activeColor = founder ? "text-mint" : "text-foreground";
  const inactiveColor = founder ? "text-background/60" : "text-foreground/55";
  return (
    <Link
      to={to}
      params={params as never}
      className={`relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold tracking-wide transition ${
        active ? activeColor : inactiveColor
      }`}
    >
      {active && (
        <span
          className={`absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full ${
            founder ? "bg-mint" : "bg-primary"
          }`}
        />
      )}
      {icon}
      <span>{label}</span>
    </Link>
  );
}
