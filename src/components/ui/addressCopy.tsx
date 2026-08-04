"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface AddressCopyProps {
  text: string;
  addresstext: string;
  hrefLink?: string;
}

/**
 * Copy-to-clipboard address chip used by the marketing contact section.
 */
const AddressCopy: React.FC<AddressCopyProps> = ({
  text,
  addresstext,
  hrefLink = "javascript:void(0)",
}) => {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <a
      href={hrefLink}
      onClick={(e) => {
        e.preventDefault();
        copy();
      }}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-gray-200 transition-colors hover:border-yellow-500/40 hover:text-yellow-400"
    >
      <span className="font-mono">{addresstext}</span>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </a>
  );
};

export default AddressCopy;
