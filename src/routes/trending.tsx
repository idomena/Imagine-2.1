import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { ToolCard } from "@/components/ToolCard";
import { Flame, Clock, ArrowUp } from "lucide-react";

export const Route = createFileRoute("/trending")({
  component: Trending,
});

function Trending() {
  const { tools } = useStore();
  const [sort, setSort] = useState<"top" | "new">("top");

  const sorted = [...tools].sort((a, b) =>
    sort === "top" ? b.upvotes - a.upvotes : b.createdAt - a.createdAt,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-3xl flex items-center gap-2">
            <Flame className="size-7 text-primary" /> Trending in the yard
          </h1>
          <p className="text-muted-foreground mt-1">The tools makers can't stop talking about.</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Tab active={sort === "top"} onClick={() => setSort("top")}><ArrowUp className="size-3.5" /> Top</Tab>
          <Tab active={sort === "new"} onClick={() => setSort("new")}><Clock className="size-3.5" /> New</Tab>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {sorted.map((t, i) => <ToolCard key={t.id} tool={t} rank={sort === "top" ? i + 1 : undefined} />)}
      </div>
    </div>
  );
}

function Tab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition ${
        active ? "bg-card shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
