"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Newspaper, ImageOff } from "lucide-react";
import { usePublicPostsQuery, usePublicNewsQuery, postImageUrl } from "@/features/content/api/content-api";
import type { Post, NewsItem } from "@/types/models";

const SLIDE_INTERVAL = 5000; // 5 seconds

export function DashboardSlider() {
  const { data, isLoading } = usePublicPostsQuery({ limit: 10 });
  const posts = data?.items ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  // Auto-scroll
  useEffect(() => {
    if (posts.length <= 2) return; // Don't auto-scroll with 1 or 2 items
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [posts.length]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const newIndex = direction === "left" 
        ? Math.max(0, currentIndex - 1)
        : Math.min(posts.length - 1, currentIndex + 1);
      setCurrentIndex(newIndex);
    }
  };

  // Mouse wheel scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (posts.length <= 2) return; // Disable wheel navigation for 1-2 items
    e.preventDefault();
    if (e.deltaY > 0) {
      scroll("right");
    } else {
      scroll("left");
    }
  };

  // Mouse drag scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (posts.length <= 2) return; // Disable drag navigation for 1-2 items
    setIsDragging(true);
    setStartX(e.pageX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || posts.length <= 2) return;
    const diff = e.pageX - startX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        scroll("left");
      } else {
        scroll("right");
      }
      setIsDragging(false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Update current index based on scroll position
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const itemWidth = scrollContainer.querySelector('[data-slide]')?.clientWidth || 400;
      const gap = 16; // gap-4 = 16px
      const scrollPosition = scrollContainer.scrollLeft;
      const newIndex = Math.round(scrollPosition / (itemWidth + gap));
      setCurrentIndex(Math.max(0, Math.min(newIndex, posts.length - 1)));
    };

    // Only add scroll listener if we're using actual scrolling
    // For the 3-item view, we use state-based navigation instead
    return () => {};
  }, [posts.length]);

  if (isLoading || posts.length === 0) return null;

  return (
    <div className="relative mb-6 rounded-2xl border bg-card overflow-hidden">
      <div className="relative aspect-[21/8] w-full sm:aspect-[21/6]">
        {/* 3D Carousel Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 px-4 py-4 items-center justify-center"
          style={{ 
            cursor: isDragging ? "grabbing" : "grab",
            perspective: "1000px"
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {(() => {
            // Handle different post counts
            if (posts.length === 1) {
              // Single post - show centered
              const post = posts[0];
              return (
                <div
                  key={0}
                  data-slide
                  className="relative flex shrink-0 overflow-hidden rounded-xl border bg-card transition-all duration-500 ease-out"
                  style={{
                    width: "60%",
                    transform: "scale(1) translateZ(0)",
                    opacity: 1,
                    zIndex: 10,
                  }}
                >
                  {post.imageUrl ? (
                    <img
                      src={postImageUrl(post.imageUrl)}
                      alt={post.title}
                      className="aspect-video w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-muted">
                      <ImageOff className="size-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-lg font-bold text-white sm:text-xl">{post.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-white/80 sm:text-sm">{post.description}</p>
                  </div>
                </div>
              );
            }
            
            if (posts.length === 2) {
              // Two posts - show both centered side by side
              return posts.map((post, index) => (
                <div
                  key={index}
                  data-slide
                  className="relative flex shrink-0 overflow-hidden rounded-xl border bg-card transition-all duration-500 ease-out"
                  style={{
                    width: "40%",
                    transform: "scale(1) translateZ(0)",
                    opacity: 1,
                    zIndex: 10,
                  }}
                >
                  {post.imageUrl ? (
                    <img
                      src={postImageUrl(post.imageUrl)}
                      alt={post.title}
                      className="aspect-video w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-muted">
                      <ImageOff className="size-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-base font-bold text-white sm:text-lg">{post.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-white/80 sm:text-sm">{post.description}</p>
                  </div>
                </div>
              ));
            }
            
            // 3+ posts - show 3 with center focus
            const leftIndex = (currentIndex - 1 + posts.length) % posts.length;
            const rightIndex = (currentIndex + 1) % posts.length;
            
            const visiblePosts = [
              { post: posts[leftIndex], position: 'left', index: leftIndex },
              { post: posts[currentIndex], position: 'center', index: currentIndex },
              { post: posts[rightIndex], position: 'right', index: rightIndex },
            ];
            
            return visiblePosts.map(({ post, position, index }) => {
              const isCenter = position === 'center';
              
              return (
                <div
                  key={index}
                  data-slide
                  className="relative flex shrink-0 overflow-hidden rounded-xl border bg-card transition-all duration-500 ease-out"
                  style={{
                    width: isCenter ? "45%" : "25%",
                    transform: isCenter 
                      ? "scale(1) translateZ(0)" 
                      : "scale(0.75) translateZ(-100px)",
                    opacity: isCenter ? 1 : 0.6,
                    zIndex: isCenter ? 10 : 1,
                  }}
                >
                  {post.imageUrl ? (
                    <img
                      src={postImageUrl(post.imageUrl)}
                      alt={post.title}
                      className="aspect-video w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-muted">
                      <ImageOff className="size-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className={`font-bold text-white transition-all ${isCenter ? "text-lg sm:text-xl" : "text-xs sm:text-sm"}`}>
                      {post.title}
                    </h3>
                    {isCenter && (
                      <p className="mt-1 line-clamp-2 text-xs text-white/80 sm:text-sm">
                        {post.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Navigation arrows */}
        {posts.length > 2 && (
          <>
            <button
              onClick={() => scroll("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 backdrop-blur-sm"
              aria-label="Previous"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 p-2 text-white transition hover:bg-black/60 backdrop-blur-sm"
              aria-label="Next"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* Scroll indicator */}
        {posts.length > 2 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {posts.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all ${i === currentIndex ? "w-6 bg-white" : "w-2 bg-white/50"}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
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
