import { useSyncExternalStore } from "react";

export type Tool = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  domain: string;
  faviconUrl: string;
  coverColor: string;
  category: string;
  tags: string[];
  upvotes: number;
  makerId: string;
  createdAt: number;
};

export type Comment = {
  id: string;
  toolId: string;
  userId: string;
  body: string;
  createdAt: number;
};

export type User = {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatarColor: string;
  emoji?: string;
  socials?: { instagram?: string; x?: string; linkedin?: string };
};

export type Review = {
  id: string;
  toolId: string;
  userId: string;
  rating: number;
  body: string;
  createdAt: number;
};

export type Question = {
  id: string;
  toolId: string;
  userId: string;
  body: string;
  answer?: string;
  answeredAt?: number;
  createdAt: number;
};

export const AVATAR_COLORS = [
  "oklch(0.86 0.16 92)",   // sun
  "oklch(0.78 0.14 175)",  // mint
  "oklch(0.7 0.18 50)",    // orange
  "oklch(0.72 0.16 220)",  // blue
  "oklch(0.65 0.2 300)",   // purple
  "oklch(0.7 0.18 25)",    // red
  "oklch(0.75 0.16 130)",  // green
  "oklch(0.68 0.18 320)",  // pink
];

export const AVATAR_EMOJIS = ["🌱","✨","🚀","🌈","🎨","🧠","🪄","🔮","🦊","🐙","🍄","🌊","🍑","☕","💡"];

const COLORS = [
  "oklch(0.78 0.14 175)",
  "oklch(0.7 0.18 50)",
  "oklch(0.65 0.2 300)",
  "oklch(0.72 0.16 220)",
  "oklch(0.74 0.17 162)",
  "oklch(0.7 0.18 25)",
  "oklch(0.75 0.16 100)",
  "oklch(0.68 0.18 320)",
];

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

const users: User[] = [
  { id: "u1", username: "anna", name: "Anna Lindqvist", bio: "Indie maker from Stockholm building tiny, useful tools. Coffee-driven, ship-on-Fridays.", avatarColor: AVATAR_COLORS[1], emoji: "🌱", socials: { instagram: "annabuilds", x: "annalindq", linkedin: "annalindqvist" } },
  { id: "u2", username: "max", name: "Max Carter", bio: "Designer turned builder. I make things that look good and ship fast. Open to collabs.", avatarColor: AVATAR_COLORS[2], emoji: "🎨", socials: { x: "maxcarter", linkedin: "maxcarter" } },
  { id: "u3", username: "kenji", name: "Kenji Tanaka", bio: "ML engineer + DX nerd. Building developer tools that feel like magic. Tokyo → remote.", avatarColor: AVATAR_COLORS[4], emoji: "🧠", socials: { x: "kenjicodes", instagram: "kenji.builds" } },
  { id: "u4", username: "you", name: "You", bio: "This is your maker profile. Tap edit to make it yours — pick a color, an emoji, write a bio.", avatarColor: AVATAR_COLORS[0], emoji: "✨", socials: {} },
];

const seedTools: Omit<Tool, "id" | "createdAt" | "upvotes">[] = [
  { name: "Loopnote", tagline: "Voice notes that summarize themselves", description: "Record any thought and Loopnote turns it into a structured note, instantly searchable.", url: "https://loopnote.app", domain: "loopnote.app", faviconUrl: "", coverColor: COLORS[0], category: "Productivity", tags: ["AI", "Notes"], makerId: "u1" },
  { name: "Pixelpost", tagline: "Schedule pixel-perfect social posts", description: "A tiny scheduler with great previews. Built for solo founders.", url: "https://pixelpost.io", domain: "pixelpost.io", faviconUrl: "", coverColor: COLORS[1], category: "Marketing", tags: ["Social", "Design"], makerId: "u2" },
  { name: "Tinyform", tagline: "Forms in 30 seconds, share anywhere", description: "No bloat. Embed beautiful forms in seconds. Stripe-ready.", url: "https://tinyform.dev", domain: "tinyform.dev", faviconUrl: "", coverColor: COLORS[2], category: "Developer", tags: ["Forms", "No-code"], makerId: "u3" },
  { name: "ShipBoard", tagline: "Tiny public roadmap for indie products", description: "Show what you're shipping. Let users vote. Stay accountable.", url: "https://shipboard.app", domain: "shipboard.app", faviconUrl: "", coverColor: COLORS[3], category: "Productivity", tags: ["Roadmap", "Community"], makerId: "u1" },
  { name: "OpenSEO", tagline: "Open-source SEO audits for makers", description: "Run a free audit, get a fix-list and watch your traffic climb.", url: "https://openseo.app", domain: "openseo.app", faviconUrl: "", coverColor: COLORS[4], category: "Marketing", tags: ["SEO", "Open Source"], makerId: "u2" },
  { name: "Mintwave", tagline: "Generate album-art-grade gradients", description: "Beautiful gradient palettes for your next product. Export tokens.", url: "https://mintwave.design", domain: "mintwave.design", faviconUrl: "", coverColor: COLORS[5], category: "Design", tags: ["Color", "Gradient"], makerId: "u3" },
  { name: "Cronjam", tagline: "Cron jobs that don't make you cry", description: "Visual cron builder + monitoring. Free for indie projects.", url: "https://cronjam.dev", domain: "cronjam.dev", faviconUrl: "", coverColor: COLORS[6], category: "Developer", tags: ["DevOps", "Cron"], makerId: "u1" },
  { name: "Quill AI", tagline: "Write changelogs from git history", description: "Point Quill at a repo and get human changelogs every release.", url: "https://quill.ai", domain: "quill.ai", faviconUrl: "", coverColor: COLORS[7], category: "Developer", tags: ["AI", "Changelog"], makerId: "u2" },
];

const initialTools: Tool[] = seedTools.map((t, i) => ({
  ...t,
  id: `t${i + 1}`,
  upvotes: 12 + Math.floor(Math.random() * 180),
  createdAt: Date.now() - i * 86400000,
  faviconUrl: `https://www.google.com/s2/favicons?domain=${t.domain}&sz=64`,
}));

const initialComments: Comment[] = [
  { id: "c1", toolId: "t1", userId: "u2", body: "Loving this. The summaries are scary good.", createdAt: Date.now() - 3600000 },
  { id: "c2", toolId: "t1", userId: "u3", body: "Would pay for a Mac menubar app.", createdAt: Date.now() - 1800000 },
  { id: "c3", toolId: "t3", userId: "u1", body: "Embedded one in 10s. Wild.", createdAt: Date.now() - 7200000 },
];

const initialReviews: Review[] = [
  { id: "r1", toolId: "t1", userId: "u2", rating: 5, body: "Replaced three apps for me. The auto-summaries are the killer feature.", createdAt: Date.now() - 86400000 },
  { id: "r2", toolId: "t1", userId: "u3", rating: 4, body: "Love it. Wish the mobile app shipped sooner.", createdAt: Date.now() - 172800000 },
  { id: "r3", toolId: "t3", userId: "u2", rating: 5, body: "Easiest form builder I've used. Stripe in two clicks.", createdAt: Date.now() - 43200000 },
];

const initialQuestions: Question[] = [
  { id: "q1", toolId: "t1", userId: "u3", body: "What problem does this solve that Apple Notes doesn't?", answer: "Apple Notes is great for typing — Loopnote is built for talking. We turn rambly voice memos into structured, searchable notes so you never lose an idea you had in the car.", answeredAt: Date.now() - 3600000, createdAt: Date.now() - 7200000 },
  { id: "q2", toolId: "t1", userId: "u2", body: "Does it work offline?", createdAt: Date.now() - 1800000 },
  { id: "q3", toolId: "t3", userId: "u1", body: "Who is Tinyform for?", answer: "Solo founders and indie hackers who need a form on a landing page in 60 seconds — without setting up Typeform or building one from scratch.", answeredAt: Date.now() - 1000000, createdAt: Date.now() - 4000000 },
];

export const REACTION_EMOJIS = ["🔥", "💎", "👏", "😍", "🧠"] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

type State = {
  tools: Tool[];
  comments: Comment[];
  reviews: Review[];
  questions: Question[];
  users: User[];
  currentUserId: string;
  upvoted: Set<string>;
  liked: Set<string>;
  bookmarked: Set<string>;
  following: Set<string>;
  reactions: Record<string, Partial<Record<ReactionEmoji, number>>>;
  myReactions: Record<string, ReactionEmoji[]>;
  mode: "user" | "founder";
};

const STORAGE_KEY = "toolyard:v1";

function load(): State {
  const base: State = {
    tools: initialTools, comments: initialComments, reviews: initialReviews, questions: initialQuestions,
    users, currentUserId: "u4", upvoted: new Set(), liked: new Set(), bookmarked: new Set(), following: new Set(),
    reactions: { t1: { "🔥": 12, "💎": 4, "😍": 7 }, t3: { "👏": 9, "🧠": 3 } },
    myReactions: {}, mode: "user",
  };
  if (typeof window === "undefined") return base;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        tools: parsed.tools ?? initialTools,
        comments: parsed.comments ?? initialComments,
        reviews: parsed.reviews ?? initialReviews,
        questions: parsed.questions ?? initialQuestions,
        users: parsed.users ?? users,
        currentUserId: parsed.currentUserId ?? "u4",
        upvoted: new Set(parsed.upvoted ?? []),
        liked: new Set(parsed.liked ?? []),
        bookmarked: new Set(parsed.bookmarked ?? []),
        following: new Set(parsed.following ?? []),
        reactions: parsed.reactions ?? base.reactions,
        myReactions: parsed.myReactions ?? {},
        mode: parsed.mode ?? "user",
      };
    }
  } catch {}
  return base;
}



let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      upvoted: Array.from(state.upvoted),
      liked: Array.from(state.liked),
      bookmarked: Array.from(state.bookmarked),
      following: Array.from(state.following),
    }),
  );
}

function emit() {
  state = { ...state };
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return state;
}

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const actions = {
  toggleUpvote(toolId: string) {
    const next = new Set(state.upvoted);
    const tool = state.tools.find((t) => t.id === toolId);
    if (next.has(toolId)) {
      next.delete(toolId);
      if (tool) tool.upvotes = Math.max(0, tool.upvotes - 1);
    } else {
      next.add(toolId);
      if (tool) tool.upvotes += 1;
    }
    state.upvoted = next;
    emit();
  },
  addTool(input: { name: string; tagline: string; description: string; url: string; category: string; tags: string[] }) {
    let domain = "";
    try { domain = new URL(input.url).hostname.replace(/^www\./, ""); } catch { domain = input.url; }
    const id = `t${Date.now()}`;
    const tool: Tool = {
      id,
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      url: input.url,
      domain,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      coverColor: pick(COLORS, state.tools.length),
      category: input.category,
      tags: input.tags,
      upvotes: 1,
      makerId: state.currentUserId,
      createdAt: Date.now(),
    };
    state.tools = [tool, ...state.tools];
    state.upvoted = new Set([...state.upvoted, id]);
    emit();
    return tool;
  },
  deleteTool(toolId: string) {
    state.tools = state.tools.filter((t) => t.id !== toolId);
    state.comments = state.comments.filter((c) => c.toolId !== toolId);
    emit();
  },
  addComment(toolId: string, body: string) {
    state.comments = [
      ...state.comments,
      { id: `c${Date.now()}`, toolId, userId: state.currentUserId, body, createdAt: Date.now() },
    ];
    emit();
  },
  updateProfile(input: { name?: string; bio?: string; avatarColor?: string; emoji?: string; socials?: { instagram?: string; x?: string; linkedin?: string } }) {
    state.users = state.users.map((u) =>
      u.id === state.currentUserId
        ? { ...u, ...input, socials: input.socials !== undefined ? input.socials : u.socials }
        : u,
    );
    emit();
  },
  setMode(mode: "user" | "founder") {
    state.mode = mode;
    emit();
  },
  addReview(toolId: string, rating: number, body: string) {
    state.reviews = [
      { id: `r${Date.now()}`, toolId, userId: state.currentUserId, rating, body, createdAt: Date.now() },
      ...state.reviews,
    ];
    emit();
  },
  askQuestion(toolId: string, body: string) {
    state.questions = [
      { id: `q${Date.now()}`, toolId, userId: state.currentUserId, body, createdAt: Date.now() },
      ...state.questions,
    ];
    emit();
  },
  answerQuestion(questionId: string, answer: string) {
    state.questions = state.questions.map((q) =>
      q.id === questionId ? { ...q, answer, answeredAt: Date.now() } : q,
    );
    emit();
  },
  syncFromAuth(data: { name: string; username: string }) {
    state.users = state.users.map((u) => {
      if (u.id !== state.currentUserId) return u;
      return {
        ...u,
        // Only overwrite defaults — don't clobber names the user has manually edited
        name: u.name === "You" ? data.name : u.name,
        username: u.username === "you" ? data.username : u.username,
      };
    });
    emit();
  },
  toggleLike(toolId: string) {
    const next = new Set(state.liked);
    if (next.has(toolId)) next.delete(toolId);
    else next.add(toolId);
    state.liked = next;
    emit();
  },
  toggleBookmark(toolId: string) {
    const next = new Set(state.bookmarked);
    if (next.has(toolId)) next.delete(toolId);
    else next.add(toolId);
    state.bookmarked = next;
    emit();
  },
  toggleReaction(toolId: string, emoji: ReactionEmoji) {
    const mine = new Set(state.myReactions[toolId] ?? []);
    const bucket = { ...(state.reactions[toolId] ?? {}) };
    const cur = bucket[emoji] ?? 0;
    if (mine.has(emoji)) {
      mine.delete(emoji);
      bucket[emoji] = Math.max(0, cur - 1);
      if (bucket[emoji] === 0) delete bucket[emoji];
    } else {
      mine.add(emoji);
      bucket[emoji] = cur + 1;
    }
    state.reactions = { ...state.reactions, [toolId]: bucket };
    state.myReactions = { ...state.myReactions, [toolId]: Array.from(mine) };
    emit();
  },
  toggleFollow(userId: string) {
    const next = new Set(state.following);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    state.following = next;
    emit();
  },
};


export function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export const CATEGORIES = ["All", "Productivity", "Developer", "Design", "Marketing", "AI"];
