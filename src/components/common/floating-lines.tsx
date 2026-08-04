"use client";

import React, { useEffect, useRef } from "react";

interface FloatingLinesProps {
  colors?: string[];
  backgroundColor?: string;
  speed?: number;
  streakCount?: number;
  streakWidth?: number;
  streakLength?: number;
  glow?: number;
  density?: number;
  twinkle?: number;
  zoom?: number;
  backgroundGlow?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  mouseRadius?: number;
}

interface Streak {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  color: string;
  twinkleOffset: number;
}

/**
 * Canvas-based animated "lightfall" of drifting glowing streaks.
 *
 * Reimplementation of the ported hero background. Renders a starfield-like
 * field of colored streaks that drift slowly and react to the mouse, with a
 * soft radial glow behind them. Falls back gracefully to a static gradient if
 * the canvas context cannot be acquired.
 */
export default function FloatingLines({
  colors = ["#114cac", "#3B82F6", "#06B6D4"],
  backgroundColor = "#030621",
  speed = 0.5,
  streakCount = 2,
  streakWidth = 1,
  streakLength = 1,
  glow = 1,
  density = 0.6,
  twinkle = 1,
  zoom = 3,
  backgroundGlow = 0.5,
  opacity = 1,
  mouseInteraction = false,
  mouseStrength = 0.5,
  mouseRadius = 0.8,
}: FloatingLinesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    // Number of streaks scales with viewport area and density.
    const baseCount = Math.floor((width * height) / 9000 * density);
    const count = Math.max(40, Math.min(400, baseCount));

    const streaks: Streak[] = [];
    for (let i = 0; i < count; i++) {
      streaks.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * zoom + 0.5,
        vx: (Math.random() - 0.5) * speed * 0.3,
        vy: (Math.random() - 0.5) * speed * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }

    let t = 0;

    function draw() {
      if (!ctx) return;
      t += 0.016;

      // Background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Background radial glow
      if (backgroundGlow > 0) {
        const grad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          Math.max(width, height) / 1.5,
        );
        grad.addColorStop(0, `${colors[0]}${Math.round(backgroundGlow * 60)
          .toString(16)
          .padStart(2, "0")}`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.globalAlpha = opacity;

      for (const s of streaks) {
        // Drift
        s.x += s.vx * s.z;
        s.y += s.vy * s.z;

        // Mouse interaction
        if (mouseInteraction && mouseRef.current.active) {
          const dx = s.x - mouseRef.current.x;
          const dy = s.y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const radius = mouseRadius * Math.min(width, height) * 0.5;
          if (dist < radius && dist > 0.1) {
            const force = (1 - dist / radius) * mouseStrength;
            s.x += (dx / dist) * force * s.z;
            s.y += (dy / dist) * force * s.z;
          }
        }

        // Wrap around edges
        if (s.x < -20) s.x = width + 20;
        if (s.x > width + 20) s.x = -20;
        if (s.y < -20) s.y = height + 20;
        if (s.y > height + 20) s.y = -20;

        const tw = twinkle > 0 ? 0.5 + 0.5 * Math.sin(t * twinkle * 2 + s.twinkleOffset) : 1;
        const size = streakWidth * s.z;
        const len = streakLength * s.z * 8;

        ctx.save();
        ctx.globalAlpha = opacity * tw * Math.min(1, s.z / zoom);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = size;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8 * glow * s.z;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * len, s.y - s.vy * len);
        ctx.stroke();
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    function onMouseMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    }
    function onMouseLeave() {
      mouseRef.current.active = false;
    }

    if (mouseInteraction) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseout", onMouseLeave);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (mouseInteraction) {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseout", onMouseLeave);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    colors,
    backgroundColor,
    speed,
    streakCount,
    streakWidth,
    streakLength,
    glow,
    density,
    twinkle,
    zoom,
    backgroundGlow,
    opacity,
    mouseInteraction,
    mouseStrength,
    mouseRadius,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
