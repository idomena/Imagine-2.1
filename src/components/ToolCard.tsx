import { Link } from "@tanstack/react-router";
import { ArrowUp, MessageCircle, ExternalLink, Bookmark } from "lucide-react";
import { Tool, actions, useStore } from "@/lib/store";

export function ToolCard({ tool, rank }: { tool: Tool; rank?: number }) {
  const { upvoted, bookmarked, comments, users } = useStore();
  const isUp = upvoted.has(tool.id);
  const isSaved = bookmarked.has(tool.id);
  const cCount = comments.filter((c) => c.toolId === tool.id).length;
  const maker = users.find((u) => u.id === tool.makerId);

  return (
    <div className="group relative flex gap-4 p-4 rounded-3xl bg-card border border-border hover:border-foreground/30 hover:-translate-y-0.5 hover:shadow-pop transition-all">
      {rank !== undefined && (
        <div className="absolute -left-2 -top-2 size-8 rounded-full bg-primary font-display text-base grid place-items-center sticker">
          {rank}
        </div>
      )}

      <Link to="/tool/$toolId" params={{ toolId: tool.id }} className="shrink-0">
        <div
          className="size-16 rounded-2xl grid place-items-center overflow-hidden sticker"
          style={{ backgroundColor: tool.coverColor }}
        >
          <img
            src={tool.faviconUrl}
            alt=""
            className="size-8 rounded"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <Link to="/tool/$toolId" params={{ toolId: tool.id }} className="min-w-0">
            <h3 className="font-display text-xl leading-tight truncate hover:text-mint transition">
              {tool.name}
            </h3>
          </Link>
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{tool.tagline}</p>
        <div className="mt-2 flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
          {maker && <span>by <span className="text-foreground/80 font-medium">@{maker.username}</span></span>}
          <span className="size-1 rounded-full bg-border" />
          <span className="px-2 py-0.5 rounded-full bg-mint-soft text-foreground/80 font-medium">{tool.category}</span>
          {tool.tags.slice(0, 2).map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full bg-muted text-foreground/60">#{t}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-1.5">
        <button
          onClick={(e) => { e.preventDefault(); actions.toggleUpvote(tool.id); }}
          className={`flex flex-col items-center justify-center min-w-[56px] px-3 py-2 rounded-2xl transition-all sticker ${
            isUp
              ? "bg-primary text-foreground"
              : "bg-card text-foreground hover:-translate-y-0.5"
          }`}
        >
          <ArrowUp className="size-4" strokeWidth={2.75} />
          <span className="font-display text-lg leading-none mt-0.5">{tool.upvotes}</span>
        </button>
        <button
          onClick={(e) => { e.preventDefault(); actions.toggleBookmark(tool.id); }}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-xl transition-all text-xs font-medium ${
            isSaved
              ? "text-mint"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={isSaved ? "Remove bookmark" : "Save"}
        >
          <Bookmark className={`size-3.5 ${isSaved ? "fill-mint" : ""}`} />
          <span>{cCount}</span>
        </button>
      </div>
    </div>
  );
}
