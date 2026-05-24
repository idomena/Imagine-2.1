import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Plus, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

export function Header() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => pathname === p;
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b bg-background/80 border-border/70 transition-colors">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 h-14 sm:h-20 flex items-center gap-2 sm:gap-5">
        <Link to="/" className="flex items-center group -my-2">
          <img src={logo} alt="Imagine" className="h-10 sm:h-16 w-auto group-hover:-rotate-2 transition" />
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1 ml-2">
          <NavLink to="/" active={isActive("/")}>Discover</NavLink>
          <NavLink to="/trending" active={isActive("/trending")}>Trending</NavLink>
          <NavLink to="/dashboard" active={isActive("/dashboard")}>Dashboard</NavLink>
        </div>

        <Link
          to="/submit"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground sticker hover:-translate-y-0.5 transition-transform"
        >
          <Plus className="size-4" strokeWidth={2.75} />
          Submit
        </Link>

        {isAuthenticated && user ? (
          <div className="ml-1 flex items-center gap-2">
            <Link to="/dashboard" title={user.displayName ?? user.email}>
              <UserAvatar user={user} />
            </Link>
            <button
              onClick={handleLogout}
              title="Log out"
              className="inline-flex items-center justify-center size-9 rounded-full bg-card text-foreground sticker transition hover:-translate-y-0.5"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="ml-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold bg-card text-foreground sticker hover:-translate-y-0.5 transition"
          >
            <LogIn className="size-4" />
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}

function UserAvatar({ user }: { user: { displayName?: string | null; email: string; avatarUrl?: string | null } }) {
  const name = user.displayName ?? user.email;
  const initials = name.slice(0, 2).toUpperCase();

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={name}
        className="size-9 rounded-full object-cover sticker hover:-rotate-6 transition-transform border-2 border-border"
      />
    );
  }

  // Deterministic color from name
  const hue = name.split("").reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="size-9 rounded-full grid place-items-center text-white text-xs font-bold sticker hover:-rotate-6 transition-transform"
      style={{ background: `oklch(0.65 0.18 ${hue})` }}
      title={name}
    >
      {initials}
    </div>
  );
}

function NavLink({ to, active, founder, children }: { to: string; active: boolean; founder?: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition ${
        active
          ? founder
            ? "bg-mint text-mint-foreground"
            : "bg-foreground text-background"
          : founder
            ? "text-background/70 hover:text-background hover:bg-background/10"
            : "text-foreground/70 hover:text-foreground hover:bg-card"
      }`}
    >
      {children}
    </Link>
  );
}

