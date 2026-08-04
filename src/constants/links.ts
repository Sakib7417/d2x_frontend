export interface NavLink {
  name: string;
  href: string;
  target?: string;
}

/**
 * Marketing navbar anchor links. All point at in-page section ids so the
 * single-page landing scrolls to each section.
 */
export const NAV_LINKS: NavLink[] = [
  { name: "About", href: "/#about" },
  { name: "Trading", href: "/#trading" },
  { name: "Roadmap", href: "/#roadmap" },
  { name: "Tokenomics", href: "/#tokenomics" },
  { name: "Products", href: "/#products" },
  { name: "FAQ", href: "/#faqs" },
];
