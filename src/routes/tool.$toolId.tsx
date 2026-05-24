import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUp,
  ExternalLink,
  MessageCircle,
  Share2,
  Calendar,
  ChevronRight,
  Star,
  HelpCircle,
  Instagram,
  Linkedin,
  Sparkles,
  CheckCircle2,
  Heart,
  Bookmark,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { actions, timeAgo, useStore, User, REACTION_EMOJIS, ReactionEmoji } from "@/lib/store";

export const Route = createFileRoute("/tool/$toolId")({
  component: ToolDetail,
});

function ToolDetail() {
  const { toolId } = Route.useParams();
  const { tools, comments, reviews, questions, users, upvoted, liked, bookmarked, reactions, myReactions, currentUserId } = useStore();
  const tool = tools.find((t) => t.id === toolId);
  const [body, setBody] = useState("");

  if (!tool) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl">Tool not found</h1>
        <Link to="/" className="mt-4 inline-block text-mint hover:underline">← Back to the yard</Link>
      </div>
    );
  }

  const maker = users.find((u) => u.id === tool.makerId);
  const me = users.find((u) => u.id === currentUserId)!;
  const isUp = upvoted.has(tool.id);
  const tComments = comments.filter((c) => c.toolId === tool.id).sort((a, b) => b.createdAt - a.createdAt);
  const tReviews = reviews.filter((r) => r.toolId === tool.id).sort((a, b) => b.createdAt - a.createdAt);
  const tQuestions = questions.filter((q) => q.toolId === tool.id).sort((a, b) => b.createdAt - a.createdAt);

  const avgRating = tReviews.length
    ? tReviews.reduce((a, r) => a + r.rating, 0) / tReviews.length
    : 0;
  const isMaker = maker?.id === currentUserId;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10 pb-44 md:pb-32">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link to="/trending" className="hover:text-foreground">Tools</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">{tool.name}</span>
      </nav>

      {/* Header card */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 sticker">
        <div className="flex items-start gap-4">
          <div
            className="size-20 rounded-2xl grid place-items-center sticker shrink-0"
            style={{ backgroundColor: tool.coverColor }}
          >
            <img src={tool.faviconUrl} alt="" className="size-10 rounded" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-none">{tool.name}</h1>
            <p className="text-foreground/70 mt-2 text-lg leading-snug">{tool.tagline}</p>
            <div className="mt-4 flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
              <span className="px-2.5 py-1 rounded-full bg-mint-soft text-foreground/80 font-medium">{tool.category}</span>
              {tool.tags.map((t) => <span key={t} className="px-2.5 py-1 rounded-full bg-muted">#{t}</span>)}
              <span className="flex items-center gap-1 ml-1"><Calendar className="size-3" /> {timeAgo(tool.createdAt)} ago</span>
              {tReviews.length > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-soft text-foreground font-semibold">
                  <Star className="size-3 fill-foreground" /> {avgRating.toFixed(1)} · {tReviews.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Engagement bar */}
      <EngagementBar
        toolId={tool.id}
        isLiked={liked.has(tool.id)}
        isSaved={bookmarked.has(tool.id)}
        reactions={reactions[tool.id] ?? {}}
        mine={myReactions[tool.id] ?? []}
      />


      {/* About */}
      <div className="mt-8">
        <h2 className="font-display text-3xl">About {tool.name}</h2>
        <p className="mt-3 text-foreground/80 leading-relaxed whitespace-pre-line">{tool.description}</p>
      </div>

      {/* Maker + socials */}
      {maker && <MakerCard maker={maker} />}

      {/* Q&A */}
      <QASection toolId={tool.id} questions={tQuestions} users={users} isMaker={isMaker} toolName={tool.name} />

      {/* Reviews */}
      <ReviewsSection toolId={tool.id} reviews={tReviews} users={users} me={me} avg={avgRating} />

      {/* Comments */}
      <div className="mt-12">
        <h2 className="font-display text-3xl flex items-center gap-2">
          <MessageCircle className="size-6 text-mint" /> Discussion · {tComments.length}
        </h2>

        <div className="mt-5 flex gap-3">
          <div className="size-10 rounded-full grid place-items-center font-semibold text-white text-sm shrink-0 sticker" style={{ backgroundColor: me.avatarColor }}>
            {me.name[0]}
          </div>
          <div className="flex-1">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Leave kind, useful feedback…"
              rows={3}
              className="w-full p-3 rounded-2xl bg-card border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none text-sm"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => {
                  if (!body.trim()) return;
                  actions.addComment(tool.id, body.trim());
                  setBody("");
                  toast.success("Comment posted");
                }}
                className="px-5 py-2 rounded-full bg-primary text-foreground font-semibold text-sm sticker hover:-translate-y-0.5 transition"
              >
                Post comment
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {tComments.map((c) => {
            const u = users.find((x) => x.id === c.userId);
            return (
              <div key={c.id} className="flex gap-3 bg-card border border-border rounded-2xl p-4">
                <div className="size-10 rounded-full grid place-items-center font-semibold text-white text-sm shrink-0 sticker" style={{ backgroundColor: u?.avatarColor }}>
                  {u?.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{u?.name}</span>
                    <span className="text-xs text-muted-foreground">@{u?.username} · {timeAgo(c.createdAt)} ago</span>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed">{c.body}</p>
                </div>
              </div>
            );
          })}
          {tComments.length === 0 && (
            <p className="text-center text-muted-foreground py-10 text-sm">Be the first to share your thoughts</p>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-5 left-0 right-0 z-30 px-3 sm:px-4 pointer-events-none">
        <div className="mx-auto max-w-2xl flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => actions.toggleUpvote(tool.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3.5 sm:px-4 py-3 rounded-full sticker font-semibold text-sm transition ${
              isUp ? "bg-mint text-foreground" : "bg-card text-foreground hover:-translate-y-0.5"
            }`}
          >
            <ArrowUp className="size-4" strokeWidth={2.75} /> {tool.upvotes}
          </button>
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex-1 inline-flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 rounded-full overflow-hidden transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
            style={{
              background: "oklch(0.22 0.03 60)",
              boxShadow: "0 1px 0 oklch(1 1 1 / 0.08) inset, 0 0 0 1px oklch(0.22 0.03 60), 0 10px 30px -8px oklch(0.22 0.03 60 / 0.5)",
            }}
          >
            <span
              aria-hidden
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: "radial-gradient(120% 80% at 20% 0%, oklch(0.85 0.18 85 / 0.35), transparent 60%), radial-gradient(120% 80% at 100% 100%, oklch(0.7 0.18 168 / 0.35), transparent 60%)",
              }}
            />
            <span
              className="relative italic text-[1.1rem] sm:text-[1.35rem] leading-none text-[oklch(0.97_0.02_85)] tracking-tight whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Visit website
            </span>
            <span
              aria-hidden
              className="relative grid place-items-center size-7 rounded-full bg-[oklch(0.85_0.18_85)] text-[oklch(0.22_0.03_60)] transition-transform duration-300 group-hover:rotate-45"
            >
              <ArrowUp className="size-3.5 rotate-45" strokeWidth={3} />
            </span>
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied!");
            }}
            className="shrink-0 grid place-items-center size-12 rounded-full bg-card sticker hover:-translate-y-0.5 transition"
            aria-label="Share"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Maker card with socials ---------- */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.78l-4.78-6.26L4.8 22H2l7.04-8.04L2 2h6.92l4.36 5.78L18.244 2Zm-2.38 18h1.6L7.27 4H5.55l10.314 16Z" />
    </svg>
  );
}

function MakerCard({ maker }: { maker: User }) {
  const s = maker.socials ?? {};
  const has = s.instagram || s.x || s.linkedin;
  return (
    <div className="mt-8 bg-card border border-border rounded-3xl p-5 sticker">
      <div className="flex items-center gap-3">
        <Link to="/u/$username" params={{ username: maker.username }} className="shrink-0">
          <div className="size-12 rounded-2xl grid place-items-center sticker text-2xl" style={{ backgroundColor: maker.avatarColor }}>
            {maker.emoji ?? maker.name[0]}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to="/u/$username" params={{ username: maker.username }} className="font-semibold hover:text-mint transition block truncate">
            {maker.name}
          </Link>
          <div className="text-xs text-muted-foreground">@{maker.username} · Maker</div>
        </div>
        <Link
          to="/u/$username"
          params={{ username: maker.username }}
          className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-foreground/80 hover:text-foreground"
        >
          View profile <ChevronRight className="size-3" />
        </Link>
      </div>
      {has && (
        <div className="mt-4 pt-4 border-t border-dashed border-border flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Connect with the maker:</span>
          {s.instagram && (
            <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-semibold hover:-translate-y-0.5 transition sticker">
              <Instagram className="size-3.5" /> @{s.instagram}
            </a>
          )}
          {s.x && (
            <a href={`https://x.com/${s.x}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-semibold hover:-translate-y-0.5 transition sticker">
              <XIcon className="size-3" /> @{s.x}
            </a>
          )}
          {s.linkedin && (
            <a href={`https://linkedin.com/in/${s.linkedin}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-semibold hover:-translate-y-0.5 transition sticker">
              <Linkedin className="size-3.5" /> LinkedIn
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Q&A ---------- */
function QASection({
  toolId,
  questions,
  users,
  isMaker,
  toolName,
}: {
  toolId: string;
  questions: ReturnType<typeof useStore>["questions"];
  users: User[];
  isMaker: boolean;
  toolName: string;
}) {
  const [q, setQ] = useState("");
  const [answering, setAnswering] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");

  return (
    <div className="mt-10">
      <div className="flex items-baseline gap-2">
        <h2 className="font-display text-3xl flex items-center gap-2">
          <HelpCircle className="size-6 text-mint" /> What problem does it solve?
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Ask {toolName}'s maker anything — what it's for, who it's built for, why it exists.
      </p>

      {/* Ask box */}
      <div className="mt-5 bg-card border border-border rounded-2xl p-4 sticker">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`e.g. What problem does ${toolName} solve?`}
            className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none text-sm"
          />
          <button
            onClick={() => {
              if (!q.trim()) return;
              actions.askQuestion(toolId, q.trim());
              setQ("");
              toast.success("Question sent to the maker ✨");
            }}
            className="px-4 py-2.5 rounded-xl bg-primary text-foreground font-semibold text-sm sticker hover:-translate-y-0.5 transition shrink-0"
          >
            Ask
          </button>
        </div>
      </div>

      {/* Q list */}
      <div className="mt-5 space-y-3">
        {questions.map((qq) => {
          const asker = users.find((u) => u.id === qq.userId);
          return (
            <div key={qq.id} className="bg-card border border-border rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-full grid place-items-center text-white font-semibold text-sm shrink-0 sticker" style={{ backgroundColor: asker?.avatarColor }}>
                  {asker?.emoji ?? asker?.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{asker?.name}</span> asked · {timeAgo(qq.createdAt)} ago
                  </div>
                  <p className="mt-1 text-foreground font-medium leading-snug">{qq.body}</p>
                </div>
              </div>

              {qq.answer ? (
                <div className="mt-4 ml-12 rounded-2xl bg-mint-soft p-4 border border-mint/30">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                    <CheckCircle2 className="size-3.5 text-mint" />
                    Maker's answer · {qq.answeredAt && timeAgo(qq.answeredAt)} ago
                  </div>
                  <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
                    {qq.answer}
                  </p>
                </div>
              ) : isMaker ? (
                answering === qq.id ? (
                  <div className="mt-3 ml-12">
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      rows={2}
                      placeholder="Write a helpful answer…"
                      className="w-full p-3 rounded-2xl bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none text-sm"
                    />
                    <div className="mt-2 flex gap-2 justify-end">
                      <button onClick={() => { setAnswering(null); setAnswer(""); }} className="px-3 py-1.5 rounded-full bg-background border border-border text-xs font-semibold">Cancel</button>
                      <button
                        onClick={() => {
                          if (!answer.trim()) return;
                          actions.answerQuestion(qq.id, answer.trim());
                          setAnswering(null); setAnswer("");
                          toast.success("Answer posted ✨");
                        }}
                        className="px-3 py-1.5 rounded-full bg-primary text-foreground text-xs font-semibold sticker"
                      >
                        Post answer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 ml-12">
                    <button onClick={() => setAnswering(qq.id)} className="text-xs font-semibold text-mint hover:underline">
                      ✍️ Answer this
                    </button>
                  </div>
                )
              ) : (
                <div className="mt-3 ml-12 text-xs text-muted-foreground italic">Awaiting maker's reply…</div>
              )}
            </div>
          );
        })}
        {questions.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">No questions yet — be the first to ask.</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Reviews ---------- */
function StarRow({ value, size = "size-4", onChange }: { value: number; size?: string; onChange?: (n: number) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={`${onChange ? "hover:scale-110" : "cursor-default"} transition`}
        >
          <Star
            className={`${size} ${n <= value ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
            strokeWidth={2}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({
  toolId,
  reviews,
  users,
  me,
  avg,
}: {
  toolId: string;
  reviews: ReturnType<typeof useStore>["reviews"];
  users: User[];
  me: User;
  avg: number;
}) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");

  const submit = () => {
    if (!rating) return toast.error("Pick a star rating first");
    if (!body.trim()) return toast.error("Add a short review");
    actions.addReview(toolId, rating, body.trim());
    setRating(0);
    setBody("");
    toast.success("Review posted ⭐");
  };

  // distribution
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.rating === n).length,
  }));
  const max = Math.max(1, ...dist.map((d) => d.count));

  return (
    <div className="mt-10">
      <h2 className="font-display text-3xl flex items-center gap-2">
        <Star className="size-6 text-mint" /> Reviews · {reviews.length}
      </h2>

      {/* Summary */}
      <div className="mt-4 grid sm:grid-cols-[auto,1fr] gap-5 bg-card border border-border rounded-2xl p-5 sticker">
        <div className="text-center sm:border-r sm:border-border sm:pr-6">
          <div className="font-display text-5xl leading-none">{avg ? avg.toFixed(1) : "—"}</div>
          <div className="mt-1.5"><StarRow value={Math.round(avg)} /></div>
          <div className="text-xs text-muted-foreground mt-1">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</div>
        </div>
        <div className="space-y-1.5">
          {dist.map((d) => (
            <div key={d.n} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-foreground/70">{d.n}</span>
              <Star className="size-3 fill-primary text-primary" />
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(d.count / max) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-muted-foreground">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write a review */}
      <div className="mt-5 bg-card border border-border rounded-2xl p-5 sticker">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full grid place-items-center text-white font-semibold text-sm shrink-0 sticker" style={{ backgroundColor: me.avatarColor }}>
            {me.emoji ?? me.name[0]}
          </div>
          <div className="text-sm font-semibold flex-1">Your rating</div>
          <StarRow value={rating} size="size-6" onChange={setRating} />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="What did you love? What could be better?"
          className="mt-3 w-full p-3 rounded-2xl bg-background border border-border focus:border-mint focus:ring-2 focus:ring-mint/20 outline-none text-sm resize-none"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={submit}
            className="px-5 py-2 rounded-full bg-primary text-foreground font-semibold text-sm sticker hover:-translate-y-0.5 transition inline-flex items-center gap-1.5"
          >
            <Sparkles className="size-3.5" /> Post review
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-5 space-y-3">
        {reviews.map((r) => {
          const u = users.find((x) => x.id === r.userId);
          return (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-full grid place-items-center text-white font-semibold text-sm shrink-0 sticker" style={{ backgroundColor: u?.avatarColor }}>
                  {u?.emoji ?? u?.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{u?.name}</span>
                    <StarRow value={r.rating} size="size-3.5" />
                    <span className="text-xs text-muted-foreground">· {timeAgo(r.createdAt)} ago</span>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground/85 leading-relaxed">{r.body}</p>
                </div>
              </div>
            </div>
          );
        })}
        {reviews.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">No reviews yet — be the first ⭐</p>
        )}
      </div>
    </div>
  );
}

/* ---------- Engagement bar (like, save, reactions) ---------- */
function EngagementBar({
  toolId,
  isLiked,
  isSaved,
  reactions,
  mine,
}: {
  toolId: string;
  isLiked: boolean;
  isSaved: boolean;
  reactions: Partial<Record<ReactionEmoji, number>>;
  mine: ReactionEmoji[];
}) {
  const [burst, setBurst] = useState(false);
  const totalReactions = Object.values(reactions).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="mt-4 flex items-stretch gap-2 flex-wrap">
      {/* Like */}
      <button
        onClick={() => {
          actions.toggleLike(toolId);
          if (!isLiked) {
            setBurst(true);
            setTimeout(() => setBurst(false), 600);
          }
        }}
        className={`group relative overflow-hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-full sticker font-semibold text-sm transition-all hover:-translate-y-0.5 ${
          isLiked ? "text-white" : "bg-card text-foreground"
        }`}
        style={
          isLiked
            ? {
                background:
                  "linear-gradient(135deg, oklch(0.7 0.2 25), oklch(0.72 0.2 350))",
                boxShadow:
                  "0 8px 22px oklch(0.7 0.2 25 / 0.35), 0 1px 0 oklch(1 1 1 / 0.2) inset",
              }
            : undefined
        }
      >
        <Heart
          className={`size-4 transition-transform ${isLiked ? "fill-white scale-110" : "group-hover:scale-110"}`}
          strokeWidth={2.5}
        />
        <span>{isLiked ? "Liked" : "Like"}</span>
        {burst && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center">
            {["-40deg", "0deg", "40deg"].map((r, i) => (
              <Heart
                key={i}
                className="absolute size-3 fill-white text-white animate-fade-out"
                style={{
                  transform: `rotate(${r}) translateY(-30px)`,
                  opacity: 0,
                  animation: "fade-out 0.6s ease-out forwards",
                  animationDelay: `${i * 60}ms`,
                }}
              />
            ))}
          </span>
        )}
      </button>

      {/* Save */}
      <button
        onClick={() => {
          actions.toggleBookmark(toolId);
          toast.success(isSaved ? "Removed from saved" : "Saved to your yard");
        }}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full sticker font-semibold text-sm transition hover:-translate-y-0.5 ${
          isSaved ? "bg-foreground text-background" : "bg-card text-foreground"
        }`}
      >
        <Bookmark className={`size-4 ${isSaved ? "fill-background" : ""}`} strokeWidth={2.5} />
        {isSaved ? "Saved" : "Save"}
      </button>

      {/* Reactions */}
      <div className="flex-1 min-w-[220px] inline-flex items-center gap-1 px-2 py-1.5 rounded-full bg-card sticker">
        {REACTION_EMOJIS.map((e) => {
          const count = reactions[e] ?? 0;
          const picked = mine.includes(e);
          return (
            <button
              key={e}
              onClick={() => actions.toggleReaction(toolId, e)}
              className={`group inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                picked ? "bg-mint-soft ring-2 ring-mint/40" : "hover:bg-muted"
              }`}
              aria-label={`React with ${e}`}
            >
              <span className="text-base leading-none transition-transform group-hover:scale-125 group-active:scale-90">
                {e}
              </span>
              {count > 0 && (
                <span className="text-xs tabular-nums text-foreground/70">{count}</span>
              )}
            </button>
          );
        })}
        {totalReactions > 0 && (
          <span className="ml-auto pr-2 text-xs text-muted-foreground hidden sm:inline">
            {totalReactions} reactions
          </span>
        )}
      </div>
    </div>
  );
}

