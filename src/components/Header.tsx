import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Plus, Compass, BarChart3, LogOut, LogIn } from "lucide-react";
import { useStore, actions } from "@/lib/store";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

export function Header() {
  const { users, currentUserId, mode } = useStore();
  const me = users.find((u) => u.id === currentUserId)!;
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => pathname === p;
  const isFounder = mode === "founder";
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.navigate({ to: "/" });
  };

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${
        isFounder ? "bg-foreground/95 border-foreground/20 text-background" : "bg-background/80 border-border/70"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 h-20 sm:h-24 flex items-center gap-5">
        <Link to="/" className="flex items-center group -my-2">
          <img
            src={logo}
            alt="Imagine"
            className={`h-16 sm:h-20 w-auto group-hover:-rotate-2 transition ${isFounder ? "invert brightness-0" : ""}`}
          />
        </Link>

        <div className="hidden md:flex items-center gap-1 flex-1 ml-2">
          <NavLink to="/" active={isActive("/")} founder={isFounder}>Discover</NavLink>
          <NavLink to="/trending" active={isActive("/trending")} founder={isFounder}>Trending</NavLink>
          <NavLink to="/dashboard" active={isActive("/dashboard")} founder={isFounder}>
            {isFounder ? "Analytics" : "Dashboard"}
          </NavLink>
        </div>

        {/* Mode toggle */}
        <ModeToggle mode={mode} />

        <Link
          to="/submit"
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold sticker hover:-translate-y-0.5 transition-transform ${
            isFounder ? "bg-mint text-mint-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          <Plus className="size-4" strokeWidth={2.75} />
          Submit
        </Link>

        {isAuthenticated ? (
          <div className="ml-1 flex items-center gap-2">
            <Link
              to="/u/$username"
              params={{ username: me.username }}
              title={user?.displayName || user?.email}
            >
              <Avatar user={me} />
            </Link>
            <button
              onClick={handleLogout}
              title="Log out"
              className={`hidden sm:inline-flex items-center justify-center size-9 rounded-full sticker transition hover:-translate-y-0.5 ${
                isFounder ? "bg-background/10 text-background" : "bg-card text-foreground"
              }`}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className={`ml-1 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold sticker hover:-translate-y-0.5 transition ${
              isFounder ? "bg-background/10 text-background" : "bg-card text-foreground"
            }`}
          >
            <LogIn className="size-4" />
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}

function ModeToggle({ mode }: { mode: "user" | "founder" }) {
  return (
    <div className="flex items-center rounded-full bg-card/20 backdrop-blur p-1 border border-current/20 text-xs font-semibold">
      <button
        onClick={() => actions.setMode("user")}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
          mode === "user" ? "bg-primary text-foreground sticker" : "opacity-70 hover:opacity-100"
        }`}
        title="Browse like a user"
      >
        <Compass className="size-3.5" />
        <span className="hidden sm:inline">User</span>
      </button>
      <button
        onClick={() => actions.setMode("founder")}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
          mode === "founder" ? "bg-mint text-mint-foreground sticker" : "opacity-70 hover:opacity-100"
        }`}
        title="Switch to founder analytics"
      >
        <BarChart3 className="size-3.5" />
        <span className="hidden sm:inline">Founder</span>
      </button>
    </div>
  );
}


function Avatar({ user }: { user: { name: string; emoji?: string; avatarColor: string } }) {
  return (
    <div
      className="size-10 rounded-full grid place-items-center font-semibold sticker hover:-rotate-6 transition-transform"
      style={{ backgroundColor: user.avatarColor }}
      title={user.name}
    >
      {user.emoji ? (
        <span className="text-lg leading-none">{user.emoji}</span>
      ) : (
        <span className="text-white text-sm">{user.name[0]}</span>
      )}
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

