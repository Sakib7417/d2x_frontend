import type { Metadata } from "next";

import AnimatedHome from "@/components/home/animated-home";

export const metadata: Metadata = {
  title: "Dollar2X Global Group Ltd — AI Auto-Trading & Investment",
  description:
    "Automated digital asset trading technology, real-time portfolio monitoring, and multiple income opportunities through a secure, transparent ecosystem.",
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return <AnimatedHome />;
}
