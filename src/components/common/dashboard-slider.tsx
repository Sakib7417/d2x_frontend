"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Newspaper, ImageOff } from "lucide-react";
import { usePublicPostsQuery, usePublicNewsQuery, postImageUrl } from "@/features/content/api/content-api";
import type { Post, NewsItem } from "@/types/models";

const SLIDE_INTERVAL = 5000; // 5 seconds

export function DashboardSlider() {
  const { data, isLoading } = usePublicPostsQuery({ limit: 10 });
  const posts = data?.items ?? [];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (posts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % posts.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [posts.length]);

  if (isLoading || posts.length === 0) return null;

  const post = posts[current];

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border bg-card">
      <div className="relative aspect-[21/8] w-full sm:aspect-[21/6]">
        {post.imageUrl ? (
          <img
            src={postImageUrl(post.imageUrl)}
            alt={post.title}
            className="size-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted">
            <ImageOff className="size-12 text-muted-foreground" />
          </div>
        )}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <h3 className="text-lg font-bold text-white sm:text-2xl">{post.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-white/80 sm:text-base">{post.description}</p>
        </div>

        {/* Navigation arrows */}
        {posts.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((prev) => (prev - 1 + posts.length) % posts.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
              aria-label="Previous"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => setCurrent((prev) => (prev + 1) % posts.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60"
              aria-label="Next"
            >
              <ChevronRight className="size-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 right-4 flex gap-1.5">
              {posts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-white" : "w-2 bg-white/50"}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function NewsTicker() {
  const { data, isLoading } = usePublicNewsQuery({ limit: 20 });
  const news = data?.items ?? [];

  if (isLoading || news.length === 0) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <div className="flex shrink-0 items-center gap-2 text-primary">
        <Newspaper className="size-4" />
        <span className="text-sm font-semibold">News</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex gap-8 whitespace-nowrap animate-news-scroll">
          {[...news, ...news].map((item, i) => (
            <span key={i} className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{item.title}:</span> {item.message}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
