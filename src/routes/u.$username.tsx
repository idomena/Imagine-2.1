import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Globe,
  MessageCircle,
  Heart,
  Rocket,
  Pencil,
  Check,
  X,
  Sparkles,
  Share2,
  Trophy,
  Flame,
  Sprout,
  Star,
  Bookmark,
  ExternalLink,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useStore,
  actions,
  AVATAR_COLORS,
  AVATAR_EMOJIS,
  type Tool,
  User,
  timeAgo,
} from "@/lib/store";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ToolCard } from "@/components/ToolCard";

// ─── Types ───────────────────────────────────────────────────────────────────

type MineApp = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  launchUrl: string | null;
  iconUrl: string | null;
  primaryColor: string | null;
  status: string;
  createdAt: string;
};

type ApiCreator = {
  id: string;
  displayName: string;
  bio: string | null;
  website: string | null;
  avatarUrl: string | null;
  accentColor: string | null;
  bannerUrl: string | null;
  verified: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mineAppToTool(app: MineApp, makerId: string): Tool {
  let domain = "";
  try {
    domain = new URL(app.launchUrl ?? "").hostname.replace(/^www\./, "");
  } catch {}
  return {
    id: app.id,
    name: app.name,
    tagline: app.tagline ?? "",
    description: app.description ?? "",
    url: app.launchUrl ?? "#",
    domain,
    faviconUrl:
      app.iconUrl ??
      (domain
        ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
        : ""),
    coverColor: app.primaryColor ?? "oklch(0.78 0.14 175)",
    category: "",
    tags: [],
    upvotes: 0,
    makerId,
    createdAt: new Date(app.createdAt).getTime(),
  };
}

const ACCENT_PRESETS = [
  "#14b8a6", // mint
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f43f5e", // rose
  "#f97316", // orange
  "#06b6d4", // cyan
];

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/u/$username")({
  component: ProfilePage,
});

// ─── Main component ───────────────────────────────────────────────────────────

function ProfilePage() {
  const { username } = Route.useParams();
  const { users, tools, comments, currentUserId, bookmarked, following } =
    useStore();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const user =
    users.find((u) => u.username === username) ??
    (username === "you"
      ? users.find((u) => u.id === currentUserId)
      : undefined);

  const isMe = user?.id === currentUserId;

  const { data: mineData } = useQuery({
    queryKey: ["apps", "mine"],
    queryFn: () =>
      apiFetch<{ items: MineApp[]; total: number }>("/api/v1/apps/mine?limit=50"),
    enabled: isMe && isAuthenticated,
    staleTime: 60_000,
  });

  const { data: creatorData } = useQuery<ApiCreator>({
    queryKey: ["creator", "me"],
    queryFn: () => apiFetch<ApiCreator>("/api/v1/creators/me"),
    enabled: isMe && isAuthenticated,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (username === "you" && user && user.username !== "you") {
      void navigate({
        to: "/u/$username",
        params: { username: user.username },
        replace: true,
      });
    }
  }, [username, user, navigate]);

  const [editing, setEditing] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="text-7xl mb-4 animate-bounce">🌱</div>
        <h1 className="font-display text-5xl">Maker not found</h1>
        <p className="text-muted-foreground mt-2">
          We looked everywhere in the yard. No one by that name.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary text-foreground px-5 py-2.5 text-sm font-semibold sticker hover:-translate-y-0.5 transition"
        >
          ← Back to the yard
        </Link>
      </div>
    );
  }

  // Derived display values — API takes priority over local store
  const displayName =
    (isMe ? creatorData?.displayName : null) ?? user.name;
  const displayBio =
    (isMe ? creatorData?.bio : null) ?? user.bio ?? "";
  const creatorAvatarUrl =
    (isMe ? creatorData?.avatarUrl : null) ?? null;
  const accentColor =
    (isMe ? creatorData?.accentColor : null) ?? "#14b8a6";
  const bannerUrl = (isMe ? creatorData?.bannerUrl : null) ?? null;
  const creatorWebsite =
    (isMe ? creatorData?.website : null) ?? null;
  const isVerified = isMe ? (creatorData?.verified ?? false) : false;

  // Tools
  const storeUserTools = tools
    .filter((t) => t.makerId === user.id)
    .sort((a, b) => b.upvotes - a.upvotes);

  const apiUserTools: Tool[] =
    isMe && mineData?.items?.length
      ? mineData.items.map((app) => mineAppToTool(app, currentUserId))
      : [];

  const apiIds = new Set(apiUserTools.map((t) => t.id));
  const userTools: Tool[] = isMe
    ? [...apiUserTools, ...storeUserTools.filter((t) => !apiIds.has(t.id))]
    : storeUserTools;

  const totalUpvotes = userTools.reduce((a, t) => a + t.upvotes, 0);
  const userComments = comments.filter((c) => c.userId === user.id);
  const commentsOnTools = comments.filter((c) =>
    userTools.some((t) => t.id === c.toolId),
  );

  const joined = useMemo(
    () =>
      userTools.length
        ? new Date(Math.min(...userTools.map((t) => t.createdAt)))
        : new Date(),
    [userTools],
  );

  const bookmarkedTools = isMe
    ? tools.filter(
        (t) => bookmarked.has(t.id) && !userTools.some((u) => u.id === t.id),
      )
    : [];

  const badges: { label: string; emoji: string; got: boolean }[] = [
    { label: "First ship", emoji: "🚀", got: userTools.length >= 1 },
    { label: "On a roll", emoji: "🔥", got: userTools.length >= 3 },
    { label: "Loved 100×", emoji: "💛", got: totalUpvotes >= 100 },
    { label: "Conversationalist", emoji: "💬", got: userComments.length >= 1 },
  ];

  const handleShare = async () => {
    const url = window.location.origin + `/u/${user.username}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${displayName} on Imagine`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied");
      }
    } catch {}
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-20 animate-fade-in">
      {/* ── Banner ──────────────────────────────────────────────────────── */}
      <div
        className="relative h-44 sm:h-56 rounded-3xl overflow-hidden sticker"
        style={
          bannerUrl
            ? {
                backgroundImage: `url(${bannerUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {
                background: `radial-gradient(ellipse at 20% 50%, ${accentColor}99 0%, transparent 60%),
                             radial-gradient(ellipse at 80% 20%, ${accentColor}55 0%, transparent 55%),
                             radial-gradient(ellipse at 60% 90%, ${accentColor}33 0%, transparent 50%),
                             oklch(0.22 0.02 80)`,
              }
        }
      >
        {bannerUrl && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60" />
        )}

        {/* Geometric decorations */}
        {!bannerUrl && (
          <>
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 blur-2xl" style={{ background: accentColor, transform: "translate(30%, -30%)" }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15 blur-xl" style={{ background: accentColor, transform: "translate(-20%, 20%)" }} />
            <div className="absolute inset-0 bg-grid opacity-10" />
          </>
        )}

        {/* Stats chips floating top-left */}
        <div className="absolute bottom-4 left-5 flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-semibold text-white/90">
            <Rocket className="size-3" />
            {userTools.length} tool{userTools.length !== 1 ? "s" : ""}
          </div>
          {totalUpvotes > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1 text-xs font-semibold text-white/90">
              <Heart className="size-3" />
              {totalUpvotes}
            </div>
          )}
        </div>

        <button
          onClick={handleShare}
          className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:-translate-y-0.5 transition cursor-pointer"
        >
          <Share2 className="size-3.5" /> Share
        </button>
      </div>

      {/* ── Identity card ────────────────────────────────────────────── */}
      <div className="-mt-12 sm:-mt-14 px-0 sm:px-2 relative z-10">
        <div
          className="bg-card/90 backdrop-blur-md border border-border rounded-3xl p-6 sm:p-8 shadow-xl"
          style={{
            boxShadow: `0 0 0 1px ${accentColor}18, 0 24px 64px -8px ${accentColor}18`,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {/* Avatar */}
            <ProfileAvatar
              user={user}
              avatarUrl={creatorAvatarUrl}
              accentColor={accentColor}
            />

            {/* Identity info */}
            <div className="flex-1 min-w-0 sm:pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-4xl sm:text-5xl leading-none tracking-tight">
                  {displayName}
                </h1>
                {isVerified && (
                  <BadgeCheck
                    className="size-6 shrink-0"
                    style={{ color: accentColor }}
                  />
                )}
                {isMe && (
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: `${accentColor}22`,
                      color: accentColor,
                      border: `1px solid ${accentColor}44`,
                    }}
                  >
                    you
                  </span>
                )}
              </div>

              <p className="text-muted-foreground mt-1 text-sm">
                @{user.username}
              </p>

              {displayBio && (
                <p className="mt-3 text-foreground/80 leading-relaxed max-w-xl text-sm whitespace-pre-line">
                  {displayBio}
                </p>
              )}
              {!displayBio && isMe && (
                <p className="mt-3 text-muted-foreground text-sm italic">
                  Tap edit to write a bio — what are you building?
                </p>
              )}

              {/* Website */}
              {creatorWebsite && (
                <a
                  href={creatorWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
                  style={{ color: accentColor }}
                >
                  <Globe className="size-3" />
                  {creatorWebsite.replace(/^https?:\/\//, "").split("/")[0]}
                  <ExternalLink className="size-2.5 opacity-60" />
                </a>
              )}

              {/* Social handles */}
              {(user.socials?.instagram ||
                user.socials?.x ||
                user.socials?.linkedin) && (
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {user.socials?.instagram && (
                    <a
                      href={`https://instagram.com/${user.socials.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-[11px] font-medium hover:bg-muted/80 hover:-translate-y-0.5 transition"
                    >
                      📸 @{user.socials.instagram}
                    </a>
                  )}
                  {user.socials?.x && (
                    <a
                      href={`https://x.com/${user.socials.x}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-[11px] font-medium hover:bg-muted/80 hover:-translate-y-0.5 transition"
                    >
                      𝕏 @{user.socials.x}
                    </a>
                  )}
                  {user.socials?.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${user.socials.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-[11px] font-medium hover:bg-muted/80 hover:-translate-y-0.5 transition"
                    >
                      <Globe className="size-3" /> {user.socials.linkedin}
                    </a>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-foreground/70 text-xs font-medium">
                  <Sprout className="size-3.5" style={{ color: accentColor }} />
                  Joined{" "}
                  {joined.toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {isMe ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold sticker hover:-translate-y-0.5 transition"
                  >
                    <Pencil className="size-3" /> Edit profile
                  </button>
                ) : (
                  <button
                    onClick={() => actions.toggleFollow(user.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold sticker hover:-translate-y-0.5 transition ${
                      following.has(user.id)
                        ? "bg-muted text-foreground border border-border"
                        : "bg-foreground text-background"
                    }`}
                  >
                    <Heart
                      className={`size-3 ${following.has(user.id) ? "fill-current" : ""}`}
                    />
                    {following.has(user.id) ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-7 grid grid-cols-3 gap-3">
            <StatTile
              icon={<Rocket className="size-4" />}
              label="Tools"
              value={userTools.length}
              accentColor={accentColor}
              accent
            />
            <StatTile
              icon={<Heart className="size-4" />}
              label="Upvotes"
              value={totalUpvotes}
              accentColor={accentColor}
            />
            <StatTile
              icon={<MessageCircle className="size-4" />}
              label="Comments"
              value={commentsOnTools.length}
              accentColor={accentColor}
            />
          </div>

          {/* Badges */}
          <div className="mt-6 pt-5 border-t border-dashed border-border/60">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="size-3.5" style={{ color: accentColor }} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Achievements
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <div
                  key={b.label}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    b.got
                      ? "text-foreground sticker"
                      : "bg-muted/40 text-muted-foreground border border-dashed border-border/60 opacity-50"
                  }`}
                  style={
                    b.got
                      ? {
                          background: `${accentColor}18`,
                          border: `1px solid ${accentColor}30`,
                        }
                      : {}
                  }
                  title={b.got ? "Earned" : "Not yet"}
                >
                  <span className={b.got ? "" : "grayscale"}>{b.emoji}</span>
                  {b.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Featured top tool ────────────────────────────────────────── */}
      {userTools[0] && (
        <section className="mt-6 px-0 sm:px-2">
          <SectionHeader
            icon={<Star className="size-4" />}
            title={isMe ? "Your top tool" : "Top tool"}
            accentColor={accentColor}
          />
          <Link
            to="/tool/$toolId"
            params={{ toolId: userTools[0].id }}
            className="block group mt-3"
          >
            <div
              className="relative rounded-3xl sticker overflow-hidden p-6 sm:p-8 transition group-hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${userTools[0].coverColor ?? accentColor}, ${accentColor}88)`,
              }}
            >
              <div className="absolute inset-0 bg-dots opacity-20" />
              <div className="relative flex items-center gap-5">
                <div className="size-16 sm:size-20 rounded-2xl bg-card/90 backdrop-blur grid place-items-center shrink-0 shadow-lg">
                  {userTools[0].faviconUrl ? (
                    <img
                      src={userTools[0].faviconUrl}
                      alt=""
                      className="size-10 sm:size-12 rounded-lg"
                    />
                  ) : (
                    <Rocket className="size-8 text-foreground/60" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-3xl sm:text-4xl truncate">
                    {userTools[0].name}
                  </div>
                  <p className="text-foreground/75 mt-1 line-clamp-2 text-sm">
                    {userTools[0].tagline}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1 rounded-full bg-card/80 backdrop-blur px-2.5 py-1">
                      <Flame className="size-3" />
                      {userTools[0].upvotes} upvotes
                    </span>
                    <span className="text-foreground/65">
                      shipped {timeAgo(userTools[0].createdAt)} ago
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── Apps grid ────────────────────────────────────────────────── */}
      <section className="mt-8 px-0 sm:px-2">
        <div className="flex items-end justify-between mb-4">
          <SectionHeader
            icon={<Rocket className="size-4" />}
            title={
              userTools.length > 1
                ? `More from ${displayName.split(" ")[0]}`
                : `Tools by ${displayName.split(" ")[0]}`
            }
            accentColor={accentColor}
          />
          {isMe && (
            <Link
              to="/submit"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-4 py-2 text-xs font-semibold sticker hover:-translate-y-0.5 transition"
            >
              <Rocket className="size-3.5" /> New tool
            </Link>
          )}
        </div>

        {userTools.length === 0 ? (
          <div className="relative bg-card border border-dashed border-border rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-dots opacity-20" />
            <div className="relative">
              <div className="text-6xl mb-3 animate-bounce">🌱</div>
              <p className="font-display text-3xl">
                {isMe ? "Your yard is empty" : "Nothing shipped yet"}
              </p>
              <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
                {isMe
                  ? "Plant your first tool — it takes less than a minute."
                  : `${displayName.split(" ")[0]} hasn't shipped anything here yet.`}
              </p>
              {isMe && (
                <Link
                  to="/submit"
                  className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary text-foreground px-5 py-2.5 text-sm font-semibold sticker hover:-translate-y-0.5 transition"
                >
                  <Rocket className="size-4" /> Plant your first tool
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {(userTools.length > 1 ? userTools.slice(1) : userTools).map(
              (t) => (
                <ToolCard key={t.id} tool={t} />
              ),
            )}
          </div>
        )}
      </section>

      {/* ── Activity ─────────────────────────────────────────────────── */}
      {userComments.length > 0 && (
        <section className="mt-10 px-0 sm:px-2">
          <SectionHeader
            icon={<MessageCircle className="size-4" />}
            title="Recent activity"
            accentColor={accentColor}
          />
          <div className="mt-4 space-y-2">
            {userComments
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, 5)
              .map((c) => {
                const t = tools.find((t) => t.id === c.toolId);
                if (!t) return null;
                return (
                  <Link
                    key={c.id}
                    to="/tool/$toolId"
                    params={{ toolId: t.id }}
                    className="block bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl p-4 hover:-translate-y-0.5 transition"
                  >
                    <p className="text-sm text-foreground/80">"{c.body}"</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      on{" "}
                      <span className="font-semibold text-foreground">
                        {t.name}
                      </span>{" "}
                      · {timeAgo(c.createdAt)} ago
                    </p>
                  </Link>
                );
              })}
          </div>
        </section>
      )}

      {/* ── Bookmarks (owner only) ────────────────────────────────────── */}
      {isMe && bookmarkedTools.length > 0 && (
        <section className="mt-10 px-0 sm:px-2">
          <SectionHeader
            icon={<Bookmark className="size-4" />}
            title="Saved"
            accentColor={accentColor}
          />
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            {bookmarkedTools.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>
      )}

      {editing && isMe && (
        <EditProfile
          user={user}
          creatorData={creatorData ?? null}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  accentColor,
}: {
  icon: React.ReactNode;
  title: string;
  accentColor: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: accentColor }}>{icon}</span>
      <h2 className="font-display text-2xl">{title}</h2>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function ProfileAvatar({
  user,
  avatarUrl,
  accentColor,
}: {
  user: User;
  avatarUrl: string | null;
  accentColor: string;
}) {
  return (
    <div className="relative shrink-0 -mt-20 sm:-mt-24">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user.name}
          className="size-28 sm:size-32 rounded-2xl object-cover border-4 border-card shadow-2xl"
        />
      ) : (
        <div
          className="size-28 sm:size-32 rounded-2xl grid place-items-center border-4 border-card shadow-2xl"
          style={{ backgroundColor: user.avatarColor }}
        >
          {user.emoji ? (
            <span className="text-5xl leading-none">{user.emoji}</span>
          ) : (
            <span className="font-display text-5xl text-white">
              {user.name[0]}
            </span>
          )}
        </div>
      )}
      <div
        className="absolute -bottom-1.5 -right-1.5 size-7 rounded-full grid place-items-center shadow-sm"
        style={{ background: accentColor }}
      >
        <Sparkles className="size-3.5 text-white/90" />
      </div>
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  accentColor,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accentColor: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3 text-center border transition"
      style={
        accent
          ? {
              background: `${accentColor}12`,
              borderColor: `${accentColor}30`,
            }
          : {}
      }
      // non-accent tiles use default card styling
      {...(!accent ? { className: "rounded-2xl px-4 py-3 text-center border border-border bg-muted/40" } : {})}
    >
      <div className="font-display text-3xl leading-none">{value}</div>
      <div
        className="text-[10px] uppercase tracking-wider mt-1.5 flex items-center justify-center gap-1 text-muted-foreground"
      >
        <span style={accent ? { color: accentColor } : {}}>{icon}</span>
        {label}
      </div>
    </div>
  );
}

// ─── Edit Profile panel ───────────────────────────────────────────────────────

function EditProfile({
  user,
  creatorData,
  onClose,
}: {
  user: User;
  creatorData: ApiCreator | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [name, setName] = useState(creatorData?.displayName ?? user.name);
  const [bio, setBio] = useState(creatorData?.bio ?? user.bio ?? "");
  const [website, setWebsite] = useState(creatorData?.website ?? "");
  const [avatarUrl, setAvatarUrl] = useState(creatorData?.avatarUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(creatorData?.bannerUrl ?? "");
  const [accentColor, setAccentColor] = useState(
    creatorData?.accentColor ?? "#14b8a6",
  );
  const [emoji, setEmoji] = useState(user.emoji ?? "✨");
  const [color, setColor] = useState(user.avatarColor);
  const [instagram, setInstagram] = useState(user.socials?.instagram ?? "");
  const [xHandle, setXHandle] = useState(user.socials?.x ?? "");
  const [linkedin, setLinkedin] = useState(user.socials?.linkedin ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("Name can't be empty");
    setSaving(true);

    // Persist to API (non-fatal)
    try {
      await apiFetch("/api/v1/creators/me", {
        method: "PATCH",
        body: {
          displayName: name.trim(),
          bio: bio.trim() || null,
          website: website.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
          accentColor: accentColor || null,
          bannerUrl: bannerUrl.trim() || null,
        },
      });
      void queryClient.invalidateQueries({ queryKey: ["creator", "me"] });
    } catch (err) {
      // Could fail if not yet onboarded as a creator — still update local store
      console.warn("Creator API update failed:", err);
    }

    // Always update local store
    actions.updateProfile({
      name: name.trim(),
      bio: bio.trim(),
      avatarColor: color,
      emoji,
      socials: {
        instagram: instagram.trim().replace(/^@/, "") || undefined,
        x: xHandle.trim().replace(/^@/, "") || undefined,
        linkedin: linkedin.trim().replace(/^@/, "") || undefined,
      },
    });

    toast.success("Profile updated");
    setSaving(false);
    onClose();
  };

  const inputCls =
    "w-full px-3 py-2.5 rounded-2xl bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none text-sm";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center px-4 py-8 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <h2 className="font-display text-2xl">Edit profile</h2>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-muted grid place-items-center hover:bg-muted/80 transition"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Live avatar preview */}
          <div className="flex justify-center">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-24 rounded-2xl object-cover border-2 border-border shadow-md"
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).style.display =
                      "none")
                  }
                />
              ) : (
                <div
                  className="size-24 rounded-2xl grid place-items-center shadow-md"
                  style={{ backgroundColor: color }}
                >
                  <span className="text-5xl leading-none">{emoji}</span>
                </div>
              )}
              <div
                className="absolute -bottom-1.5 -right-1.5 size-6 rounded-full grid place-items-center"
                style={{ background: accentColor }}
              >
                <Sparkles className="size-3 text-white/90" />
              </div>
            </div>
          </div>

          {/* Identity */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Identity
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Display name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="What are you building?"
                  className={`${inputCls} resize-none`}
                />
                <div className="mt-1 text-right text-xs text-muted-foreground">
                  {bio.length}/500
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Website
                </label>
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yoursite.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Avatar URL
                </label>
                <input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Or pick an emoji below if no URL is set.
                </p>
              </div>
            </div>
          </section>

          {/* Emoji + color fallback (when no avatarUrl) */}
          {!avatarUrl && (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Emoji avatar
              </p>
              <div className="grid grid-cols-8 gap-1.5 mb-3">
                {AVATAR_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`aspect-square rounded-xl text-xl grid place-items-center transition ${
                      emoji === e
                        ? "bg-primary sticker"
                        : "bg-background border border-border hover:bg-muted"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="size-8 rounded-xl relative transition hover:-translate-y-0.5"
                    style={{
                      backgroundColor: c,
                      border: color === c ? "2px solid white" : "2px solid transparent",
                      boxShadow: color === c ? "0 0 0 2px rgba(0,0,0,0.3)" : "none",
                    }}
                  >
                    {color === c && (
                      <Check className="size-4 text-white absolute inset-0 m-auto" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Appearance */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Appearance
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Accent color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="size-10 rounded-xl border border-border cursor-pointer bg-background"
                    style={{ padding: "2px" }}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {ACCENT_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAccentColor(c)}
                        className="size-7 rounded-lg transition hover:-translate-y-0.5"
                        style={{
                          backgroundColor: c,
                          border:
                            accentColor === c
                              ? "2px solid white"
                              : "2px solid transparent",
                          boxShadow:
                            accentColor === c
                              ? "0 0 0 2px rgba(0,0,0,0.4)"
                              : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  Banner URL
                </label>
                <input
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Leave blank to use the accent color gradient.
                </p>
              </div>
            </div>
          </section>

          {/* Socials */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Socials
            </p>
            <div className="space-y-2">
              {[
                { label: "Instagram", prefix: "@", value: instagram, setter: setInstagram },
                { label: "X / Twitter", prefix: "@", value: xHandle, setter: setXHandle },
                { label: "LinkedIn", prefix: "/in/", value: linkedin, setter: setLinkedin },
              ].map(({ label, prefix, value, setter }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-background border border-border focus-within:border-mint focus-within:ring-2 focus-within:ring-mint/20"
                >
                  <span className="text-xs font-semibold text-muted-foreground w-24 shrink-0">
                    {label}
                  </span>
                  <span className="text-muted-foreground text-sm">{prefix}</span>
                  <input
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder="username"
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-muted font-semibold text-sm hover:bg-muted/80 transition"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-full bg-foreground text-background py-2.5 font-semibold text-sm sticker hover:-translate-y-0.5 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="size-3.5 animate-spin" /> Saving…</>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
