import React from "react";
import { Send, Share2, Play, Globe } from "lucide-react";

const socials = [
  { name: "Telegram", href: "#", Icon: Send },
  { name: "Twitter", href: "#", Icon: Share2 },
  { name: "YouTube", href: "#", Icon: Play },
  { name: "Website", href: "#", Icon: Globe },
];

/**
 * Social media icon row used in the marketing footer.
 */
const SocialLinks: React.FC = () => {
  return (
    <div className="flex items-center justify-center gap-4">
      {socials.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          aria-label={name}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-gray-300 transition-all hover:scale-110 hover:border-yellow-500/50 hover:text-yellow-400"
        >
          <Icon size={18} />
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
