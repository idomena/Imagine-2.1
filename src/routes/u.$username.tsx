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
} from "lucide-react";
import { toast } from "sonner";
import {
  useStore,
  actions,
  AVATAR_COLORS,
  AVATAR_EMOJIS,
  User,
  timeAgo,
} from "@/lib/store";
import { ToolCard } from "@/components/ToolCard";

export const Route = createFileRoute("/u/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { users, tools, comments, currentUserId, bookmarked } = useStore();
  const navigate = useNavigate();

  // "/u/you" is the legacy self-profile URL — fall back to current user by ID
  const user =
    users.find((u) => u.username === username) ??
    (username === "you" ? users.find((u) => u.id === currentUserId) : undefined);

  // Once the store is synced with the real handle, redirect the URL silently
  useEffect(() => {
    if (username === "you" && user && user.username !== "you") {
      void navigate({ to: "/u/$username", params: { username: user.username }, replace: true });
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

  const userTools = tools
    .filter((t) => t.makerId === user.id)
    .sort((a, b) => b.upvotes - a.upvotes);
  const totalUpvotes = userTools.reduce((a, t) => a + t.upvotes, 0);
  const userComments = comments.filter((c) => c.userId === user.id);
  const commentsOnTools = comments.filter((c) =>
    userTools.some((t) => t.id === c.toolId),
  );
  const isMe = user.id === currentUserId;

  const joined = useMemo(
    () =>
      userTools.length
        ? new Date(Math.min(...userTools.map((t) => t.createdAt)))
        : new Date(),
    [userTools],
  );

  const topTool = userTools[0];
  const otherTools = userTools.slice(1);

  const bookmarkedTools = isMe
    ? tools.filter((t) => bookmarked.has(t.id) && !userTools.some((u) => u.id === t.id))
    : [];

  // Tiny achievement badges — friendly + motivating
  const badges: { label: string; emoji: string; got: boolean }[] = [
    { label: "First ship", emoji: "🚀", got: userTools.length >= 1 },
    { label: "On a roll", emoji: "🔥", got: userTools.length >= 3 },
    { label: "Loved 100×", emoji: "💛", got: totalUpvotes >= 100 },
    { label: "Conversationalist", emoji: "💬", got: userComments.length >= 1 },
  ];
  const earnedCount = badges.filter((b) => b.got).length;

  const sharePath = `/u/${user.username}`;
  const handleShare = async () => {
    const url =
      typeof window !== "undefined"
        ? window.location.origin + sharePath
        : sharePath;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `${user.name} on Imagine`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied ✨");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10 animate-fade-in">
      {/* ---------- Cover ---------- */}
      <div
        className="relative h-44 sm:h-56 rounded-3xl sticker overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${user.avatarColor}, var(--mint))`,
        }}
      >
        <div className="absolute inset-0 bg-dots opacity-25" />
        {/* Floating decorative stickers — user's own emoji */}
        <div className="absolute top-6 left-8 text-3xl rotate-[-14deg] opacity-80 select-none animate-fade-in">
          {user.emoji ?? "✨"}
        </div>
        <div className="absolute top-10 right-24 text-2xl rotate-[12deg] opacity-70 select-none">
          {user.emoji ?? "✨"}
        </div>
        <div className="absolute bottom-6 left-1/3 text-xl rotate-[-6deg] opacity-60 select-none">
          {user.emoji ?? "✨"}
        </div>
        <div className="absolute -bottom-3 right-4 text-7xl sm:text-9xl opacity-30 select-none">
          {user.emoji ?? "✨"}
        </div>

        {/* Share button, top-right */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur px-3 py-1.5 text-xs font-semibold sticker hover:-translate-y-0.5 transition"
        >
          <Share2 className="size-3.5" /> Share
        </button>
      </div>

      {/* ---------- Identity card ---------- */}
      <div className="-mt-16 sm:-mt-20 px-2 sm:px-6">
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 sticker">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <AvatarLarge user={user} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-4xl sm:text-5xl leading-none tracking-tight">
                  {user.name}
                </h1>
                {isMe && (
                  <span className="px-2.5 py-1 rounded-full bg-primary text-foreground text-xs font-semibold sticker">
                    that's you
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1.5">@{user.username}</p>
              <p className="mt-4 text-foreground/85 leading-relaxed max-w-2xl whitespace-pre-line">
                {user.bio ||
                  (isMe
                    ? "Tap edit to write a bio — what are you building?"
                    : "No bio yet.")}
              </p>

              {/* Social links */}
              {(user.socials?.instagram || user.socials?.x || user.socials?.linkedin) && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {user.socials?.instagram && (
                    <a
                      href={`https://instagram.com/${user.socials.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-semibold hover:bg-muted hover:-translate-y-0.5 transition sticker"
                    >
                      <span className="text-sm leading-none">📸</span>
                      @{user.socials.instagram}
                    </a>
                  )}
                  {user.socials?.x && (
                    <a
                      href={`https://x.com/${user.socials.x}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-semibold hover:bg-muted hover:-translate-y-0.5 transition sticker"
                    >
                      <span className="text-sm font-bold leading-none">𝕏</span>
                      @{user.socials.x}
                    </a>
                  )}
                  {user.socials?.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${user.socials.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-semibold hover:bg-muted hover:-translate-y-0.5 transition sticker"
                    >
                      <Globe className="size-3" />
                      {user.socials.linkedin}
                    </a>
                  )}
                </div>
              )}

              <div className="mt-5 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint-soft text-foreground text-xs font-semibold">
                  <Sprout className="size-3.5 text-mint" />
                  Joined{" "}
                  {joined.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-soft text-foreground text-xs font-semibold">
                  <Trophy className="size-3.5" />
                  {earnedCount}/{badges.length} badges
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
                    onClick={() => toast("Follows are coming soon ✨")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold sticker hover:-translate-y-0.5 transition"
                  >
                    <Heart className="size-3" /> Follow
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stats row — own line, never crammed */}
          <div className="mt-7 grid grid-cols-3 gap-3">
            <Stat icon={<Rocket className="size-3.5" />} label="Tools" value={userTools.length} tone="primary" />
            <Stat icon={<Heart className="size-3.5" />} label="Upvotes" value={totalUpvotes} tone="mint" />
            <Stat icon={<MessageCircle className="size-3.5" />} label="Comments" value={commentsOnTools.length} tone="default" />
          </div>


          {/* ---------- Badges row ---------- */}
          <div className="mt-7 pt-6 border-t border-dashed border-border">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-mint" />
              <h3 className="font-display text-xl">Badges</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => (
                <div
                  key={b.label}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    b.got
                      ? "bg-primary text-foreground sticker"
                      : "bg-muted text-muted-foreground border border-dashed border-border opacity-70"
                  }`}
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

      {/* ---------- Top tool spotlight ---------- */}
      {topTool && (
        <section className="mt-10 px-2 sm:px-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="size-4 text-mint" />
            <h2 className="font-display text-2xl">
              {isMe ? "Your top tool" : "Top tool"}
            </h2>
          </div>
          <Link
            to="/tool/$toolId"
            params={{ toolId: topTool.id }}
            className="block group"
          >
            <div
              className="relative rounded-3xl sticker overflow-hidden p-6 sm:p-8 transition group-hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${topTool.coverColor}, var(--primary))`,
              }}
            >
              <div className="absolute inset-0 bg-dots opacity-25" />
              <div className="relative flex items-center gap-5">
                <div className="size-16 sm:size-20 rounded-2xl bg-card grid place-items-center sticker shrink-0">
                  {topTool.faviconUrl ? (
                    <img
                      src={topTool.faviconUrl}
                      alt=""
                      className="size-10 sm:size-12 rounded-lg"
                    />
                  ) : (
                    <Rocket className="size-8" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-3xl sm:text-4xl truncate">
                    {topTool.name}
                  </div>
                  <p className="text-foreground/80 mt-1 line-clamp-2">
                    {topTool.tagline}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 sticker">
                      <Flame className="size-3" />
                      {topTool.upvotes} upvotes
                    </span>
                    <span className="text-foreground/70">
                      shipped {timeAgo(topTool.createdAt)} ago
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ---------- All tools grid ---------- */}
      <section className="mt-10 px-2 sm:px-6">
        <div className="flex items-end justify-between mb-5">
          <h2 className="font-display text-3xl">
            {topTool ? "More from " : "Tools by "}
            <span className="text-mint">
              {user.name.split(" ")[0]}
            </span>
          </h2>
          {isMe && userTools.length > 0 && (
            <Link
              to="/submit"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary text-foreground px-4 py-2 text-sm font-semibold sticker hover:-translate-y-0.5 transition"
            >
              <Rocket className="size-4" /> Submit new
            </Link>
          )}
        </div>

        {userTools.length === 0 ? (
          <div className="relative bg-card border border-border border-dashed rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-dots opacity-30" />
            <div className="relative">
              <div className="text-6xl mb-3 animate-bounce">🌱</div>
              <p className="font-display text-3xl">
                {isMe ? "Your yard is empty" : "Nothing shipped yet"}
              </p>
              <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
                {isMe
                  ? "Plant your first tool — it takes less than a minute, and the community is waiting."
                  : `${user.name.split(" ")[0]} hasn't shipped anything here yet. Check back soon.`}
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
        ) : otherTools.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {otherTools.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            That's the only one — for now.
          </p>
        )}
      </section>

      {/* ---------- Recent activity ---------- */}
      {userComments.length > 0 && (
        <section className="mt-12 px-2 sm:px-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="size-4 text-mint" />
            <h2 className="font-display text-2xl">Recent activity</h2>
          </div>
          <div className="space-y-3">
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
                    className="block bg-card border border-border rounded-2xl p-4 hover:-translate-y-0.5 transition sticker"
                  >
                    <p className="text-sm text-foreground/85">"{c.body}"</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      on <span className="font-semibold text-foreground">{t.name}</span> · {timeAgo(c.createdAt)} ago
                    </p>
                  </Link>
                );
              })}
          </div>
        </section>
      )}

      {/* ---------- Bookmarks (owner only) ---------- */}
      {isMe && bookmarkedTools.length > 0 && (
        <section className="mt-12 px-2 sm:px-6">
          <div className="flex items-center gap-2 mb-4">
            <Bookmark className="size-4 text-mint" />
            <h2 className="font-display text-2xl">Saved</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {bookmarkedTools.map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </section>
      )}

      {editing && isMe && (
        <EditProfile user={user} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

function AvatarLarge({ user }: { user: User }) {
  return (
    <div className="relative shrink-0 -mt-20 md:-mt-24">
      <div
        className="size-28 sm:size-32 rounded-3xl grid place-items-center sticker"
        style={{ backgroundColor: user.avatarColor }}
      >
        {user.emoji ? (
          <span className="text-6xl leading-none">{user.emoji}</span>
        ) : (
          <span className="font-display text-6xl text-white">
            {user.name[0]}
          </span>
        )}
      </div>
      <div className="absolute -bottom-1.5 -right-1.5 size-7 rounded-full bg-mint grid place-items-center sticker">
        <Sparkles className="size-3.5 text-mint-foreground" />
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "primary" | "mint" | "default";
}) {
  const bg =
    tone === "primary"
      ? "bg-primary-soft"
      : tone === "mint"
      ? "bg-mint-soft"
      : "bg-background";
  return (
    <div className={`${bg} border border-border rounded-2xl px-4 py-3 text-center min-w-[80px] sticker`}>
      <div className="font-display text-3xl leading-none">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1.5 flex items-center justify-center gap-1">
        <span className="text-foreground">{icon}</span>
        {label}
      </div>
    </div>
  );
}

function EditProfile({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [emoji, setEmoji] = useState(user.emoji ?? "✨");
  const [color, setColor] = useState(user.avatarColor);
  const [instagram, setInstagram] = useState(user.socials?.instagram ?? "");
  const [xHandle, setXHandle] = useState(user.socials?.x ?? "");
  const [linkedin, setLinkedin] = useState(user.socials?.linkedin ?? "");

  const save = () => {
    if (!name.trim()) return toast.error("Name can't be empty");
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
    toast.success("Profile updated ✨");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center px-4 py-8 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-3xl sticker w-full max-w-md p-6 sm:p-7 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-3xl">Edit profile</h2>
          <button
            onClick={onClose}
            className="size-9 rounded-full bg-background border border-border grid place-items-center hover:bg-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Live avatar preview */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className="size-28 rounded-3xl grid place-items-center sticker"
              style={{ backgroundColor: color }}
            >
              <span className="text-6xl leading-none">{emoji}</span>
            </div>
            <div className="absolute -bottom-1.5 -right-1.5 size-7 rounded-full bg-mint grid place-items-center sticker">
              <Sparkles className="size-3.5 text-mint-foreground" />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold">Pick an emoji</label>
            <div className="mt-2 grid grid-cols-8 gap-1.5">
              {AVATAR_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`aspect-square rounded-xl text-xl grid place-items-center transition ${
                    emoji === e
                      ? "bg-primary sticker"
                      : "bg-background border border-border hover:bg-muted hover:-translate-y-0.5"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Pick a color</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`size-10 rounded-2xl transition relative ${
                    color === c
                      ? "sticker -translate-y-0.5"
                      : "border border-border hover:-translate-y-0.5"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label="color swatch"
                >
                  {color === c && (
                    <Check
                      className="size-5 text-foreground absolute inset-0 m-auto"
                      strokeWidth={3}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="mt-2 w-full px-3 py-2.5 rounded-2xl bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="What are you building?"
              className="mt-2 w-full px-3 py-2.5 rounded-2xl bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none text-sm resize-none"
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {bio.length}/200
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Socials <span className="text-xs font-normal text-muted-foreground">(optional)</span></label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-background border border-border focus-within:border-mint focus-within:ring-2 focus-within:ring-mint/20">
                <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">Instagram</span>
                <span className="text-muted-foreground text-sm">@</span>
                <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="username" className="flex-1 bg-transparent outline-none text-sm" />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-background border border-border focus-within:border-mint focus-within:ring-2 focus-within:ring-mint/20">
                <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">X</span>
                <span className="text-muted-foreground text-sm">@</span>
                <input value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="username" className="flex-1 bg-transparent outline-none text-sm" />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-background border border-border focus-within:border-mint focus-within:ring-2 focus-within:ring-mint/20">
                <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">LinkedIn</span>
                <span className="text-muted-foreground text-sm">/in/</span>
                <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="slug" className="flex-1 bg-transparent outline-none text-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-background border border-border font-semibold text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="flex-1 rounded-full bg-primary text-foreground py-2.5 font-semibold text-sm sticker hover:-translate-y-0.5 transition"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
