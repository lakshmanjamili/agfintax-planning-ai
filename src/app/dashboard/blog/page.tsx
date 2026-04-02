"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  ArrowRight,
  Tag,
  Filter,
  Newspaper,
  ChevronLeft,
  X,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { BLOG_POSTS, BLOG_CATEGORIES, type BlogPost, type BlogCategory } from "@/lib/content/blog-data";
import { MASTER_STRATEGIES } from "@/lib/tax/smart-plan-strategies";

// ---------------------------------------------------------------------------
// Category color map
// ---------------------------------------------------------------------------
const catColorMap: Record<string, string> = {};
for (const c of BLOG_CATEGORIES) catColorMap[c.id] = c.color;

function categoryColor(cat: BlogCategory): string {
  return catColorMap[cat] ?? "#FFB596";
}

function categoryLabel(cat: BlogCategory): string {
  return BLOG_CATEGORIES.find((c) => c.id === cat)?.label ?? cat;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function BlogPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BlogCategory | "all">("all");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const filtered = useMemo(() => {
    let posts = BLOG_POSTS;
    if (selectedCategory !== "all") {
      posts = posts.filter((p) => p.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return posts;
  }, [search, selectedCategory]);

  const featured = BLOG_POSTS.filter((p) => p.featured);

  // Reading a single post
  if (selectedPost) {
    return <BlogPostView post={selectedPost} onBack={() => setSelectedPost(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#131318] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-[#DC5700]/20">
              <Newspaper className="w-5 h-5 text-[#FFB596]" />
            </div>
            <h1 className="text-2xl font-bold text-[#E4E1E9]">Tax News & Insights</h1>
          </div>
          <p className="text-sm text-[#C7C5D3] ml-12">
            Stay ahead with the latest tax strategies, IRS updates, and actionable tips for business owners.
          </p>
        </div>

        {/* Featured Posts */}
        {featured.length > 0 && selectedCategory === "all" && !search && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-[#C7C5D3] uppercase tracking-wider mb-4">Featured</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featured.map((post) => (
                <button
                  key={post.slug}
                  onClick={() => setSelectedPost(post)}
                  className="text-left rounded-2xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5 p-6 hover:border-[#DC5700]/30 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${categoryColor(post.category)}15`, color: categoryColor(post.category) }}
                    >
                      {categoryLabel(post.category)}
                    </span>
                    <span className="text-[10px] text-[#C7C5D3] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#E4E1E9] mb-2 group-hover:text-[#FFB596] transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-sm text-[#C7C5D3] leading-relaxed line-clamp-2 mb-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#DC5700] font-medium">
                    Read article <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C7C5D3]" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[rgba(31,31,37,0.6)] border border-white/10 text-sm text-[#E4E1E9] placeholder:text-[#C7C5D3]/50 focus:outline-none focus:border-[#DC5700]/40"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <Filter className="w-4 h-4 text-[#C7C5D3] shrink-0" />
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === "all"
                  ? "bg-[#DC5700] text-white"
                  : "bg-white/5 text-[#C7C5D3] hover:bg-white/10"
              }`}
            >
              All
            </button>
            {BLOG_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "text-white"
                    : "bg-white/5 text-[#C7C5D3] hover:bg-white/10"
                }`}
                style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Post Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Newspaper className="w-10 h-10 text-[#C7C5D3]/30 mx-auto mb-3" />
            <p className="text-sm text-[#C7C5D3]">No articles found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((post) => (
              <button
                key={post.slug}
                onClick={() => setSelectedPost(post)}
                className="text-left rounded-2xl bg-[rgba(31,31,37,0.6)] backdrop-blur-[16px] border border-white/5 p-5 hover:border-[#DC5700]/30 transition-all group flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${categoryColor(post.category)}15`, color: categoryColor(post.category) }}
                  >
                    {categoryLabel(post.category)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#E4E1E9] mb-2 group-hover:text-[#FFB596] transition-colors leading-tight">
                  {post.title}
                </h3>
                <p className="text-sm text-[#C7C5D3] leading-relaxed line-clamp-3 mb-4 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-[#C7C5D3]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                  <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Post View
// ---------------------------------------------------------------------------
function BlogPostView({ post, onBack }: { post: BlogPost; onBack: () => void }) {
  // Find related strategies
  const relatedStrategies = post.relatedStrategyIds
    .map((id) => MASTER_STRATEGIES.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#131318] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[#C7C5D3] hover:text-white transition mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Blog
        </button>

        {/* Post header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{ backgroundColor: `${categoryColor(post.category)}15`, color: categoryColor(post.category) }}
            >
              {categoryLabel(post.category)}
            </span>
            <span className="text-xs text-[#C7C5D3] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#E4E1E9] leading-tight mb-3">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-[#C7C5D3]">
            <span>By {post.author}</span>
            <span className="text-white/20">|</span>
            <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-white/5 text-[#C7C5D3] border border-white/5"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>

        {/* Content */}
        <article
          className="prose prose-invert prose-sm max-w-none
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#E4E1E9] [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[#FFB596] [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:text-[15px] [&_p]:text-[#C7C5D3] [&_p]:leading-relaxed [&_p]:mb-4
            [&_strong]:text-[#E4E1E9]
            [&_ul]:space-y-1.5 [&_ul]:mb-4 [&_ol]:space-y-1.5 [&_ol]:mb-4
            [&_li]:text-[15px] [&_li]:text-[#C7C5D3] [&_li]:leading-relaxed
            [&_code]:bg-[#35343A] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[#FFB596] [&_code]:text-xs
            [&_blockquote]:border-l-2 [&_blockquote]:border-[#DC5700] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#C7C5D3]
            [&_table]:w-full [&_th]:text-left [&_th]:text-[#E4E1E9] [&_th]:pb-2 [&_th]:border-b [&_th]:border-white/10
            [&_td]:py-2 [&_td]:text-[#C7C5D3] [&_td]:border-b [&_td]:border-white/5
          "
        >
          {post.content.split("\n").map((line, i) => {
            // Simple markdown-like rendering
            if (line.startsWith("## ")) return <h2 key={i}>{line.slice(3)}</h2>;
            if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>;
            if (line.startsWith("- **")) {
              const match = line.match(/^- \*\*(.+?)\*\*\s*[—–-]*\s*(.*)/);
              if (match) return <li key={i}><strong>{match[1]}</strong> {match[2] ? `— ${match[2]}` : ""}</li>;
            }
            if (line.startsWith("- ")) return <li key={i}>{line.slice(2)}</li>;
            if (line.match(/^\d+\.\s/)) return <li key={i}>{line.replace(/^\d+\.\s/, "")}</li>;
            if (line.startsWith("*") && line.endsWith("*")) return <p key={i} className="italic text-[#C7C5D3]/70 text-sm">{line.slice(1, -1)}</p>;
            if (line.startsWith("|")) return null; // Skip table rows (simplified)
            if (line.trim() === "") return <br key={i} />;
            return <p key={i}>{line}</p>;
          })}
        </article>

        {/* Related Strategies */}
        {relatedStrategies.length > 0 && (
          <div className="mt-12 pt-8 border-t border-white/10">
            <h3 className="text-sm font-semibold text-[#C7C5D3] uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FFB596]" />
              Related Tax Strategies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedStrategies.map((strategy) => strategy && (
                <Link
                  key={strategy.id}
                  href="/dashboard/strategies"
                  className="rounded-xl bg-[rgba(31,31,37,0.6)] border border-white/5 p-4 hover:border-[#4CD6FB]/30 transition-all group"
                >
                  <p className="text-sm font-semibold text-[#E4E1E9] group-hover:text-[#4CD6FB] transition-colors">
                    {strategy.title}
                  </p>
                  <p className="text-xs text-[#C7C5D3] mt-1">
                    Saves {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(strategy.typicalSavingsRange.min)}
                    –{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(strategy.typicalSavingsRange.max)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 rounded-2xl bg-gradient-to-r from-[#DC5700]/20 to-[#DC5700]/5 border border-[#DC5700]/20 p-6 text-center">
          <BookOpen className="w-8 h-8 text-[#FFB596] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#E4E1E9] mb-2">Want a Personalized Tax Plan?</h3>
          <p className="text-sm text-[#C7C5D3] mb-4 max-w-md mx-auto">
            Our AI-powered Smart Plan analyzes your unique situation and identifies the strategies that save you the most.
          </p>
          <Link
            href="/dashboard/smart-plan"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#DC5700] hover:bg-[#DC5700]/80 text-white rounded-xl text-sm font-semibold transition"
          >
            Build My Smart Plan <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
