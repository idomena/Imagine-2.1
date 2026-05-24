import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, TrendingUp, Plus, BarChart3, User as UserIcon } from "lucide-react";
import { useStore } from "@/lib/store";

export function MobileNav() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { users, currentUserId, mode } = useStore();
  const me = users.find((u) => u.id === currentUserId)!;
  const isFounder = mode === "founder";
  const is = (p: string) => pathname === p;

  return (
    <nav
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] ${
        isFounder ? "bg-foreground/95 text-background border-t border-background/10" : "bg-background/90 border-t border-border"
      } backdrop-blur-xl`}
      aria-label="Primary"
    >
      <div className="relative mx-auto max-w-md grid grid-cols-5 items-end px-2 pt-1">
        <Item to="/" active={is("/")} icon={<Compass className="size-5" />} label="Discover" founder={isFounder} />
        <Item to="/trending" active={is("/trending")} icon={<TrendingUp className="size-5" />} label="Trending" founder={isFounder} />

        {/* center submit — raised */}
        <div className="flex justify-center -mt-7">
          <Link
            to="/submit"
            aria-label="Submit a tool"
            className={`grid place-items-center size-14 rounded-full sticker active:scale-95 transition ${
              isFounder ? "bg-mint text-mint-foreground" : "bg-primary text-foreground"
            }`}
            style={{
              boxShadow:
                "0 12px 28px oklch(0.22 0.03 60 / 0.25), 0 1px 0 oklch(1 1 1 / 0.25) inset",
            }}
          >
            <Plus className="size-6" strokeWidth={2.75} />
          </Link>
        </div>

        <Item to="/dashboard" active={is("/dashboard")} icon={<BarChart3 className="size-5" />} label={isFounder ? "Stats" : "Yours"} founder={isFounder} />
        <Item
          to="/u/$username"
          params={{ username: me.username }}
          active={pathname.startsWith("/u/")}
          icon={
            <span
              className="grid place-items-center size-6 rounded-full text-[12px] sticker"
              style={{ backgroundColor: me.avatarColor }}
              aria-hidden
            >
              {me.emoji ?? <UserIcon className="size-3.5 text-white" />}
            </span>
          }
          label="You"
          founder={isFounder}
        />
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
