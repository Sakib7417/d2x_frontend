"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Floating "back to top" button. Appears after scrolling and smooth-scrolls
 * to the top on click.
 */
const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-yellow-500/40 bg-blue-950/80 text-yellow-400 shadow-lg shadow-blue-950/40 backdrop-blur-md transition-all hover:scale-110 hover:bg-yellow-500/10"
    >
      <ArrowUp size={20} />
    </button>
  );
};

export default BackToTopButton;
