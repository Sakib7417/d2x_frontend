"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Users, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { ReferralTreeNode } from "@/types/models";

interface NetworkTreeProps {
  data: ReferralTreeNode;
  className?: string;
}

const levelColors: Record<number, string> = {
  0: "from-amber-500/20 to-orange-500/20 border-amber-500/40",
  1: "from-violet-500/20 to-purple-500/20 border-violet-500/40",
  2: "from-emerald-500/20 to-teal-500/20 border-emerald-500/40",
  3: "from-sky-500/20 to-cyan-500/20 border-sky-500/40",
  4: "from-rose-500/20 to-pink-500/20 border-rose-500/40",
};

const badgeColors: Record<number, string> = {
  0: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  1: "bg-violet-500/20 text-violet-200 border-violet-500/40",
  2: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  3: "bg-sky-500/20 text-sky-200 border-sky-500/40",
  4: "bg-rose-500/20 text-rose-200 border-rose-500/40",
};

function collectMatches(node: ReferralTreeNode, term: string, set: Set<string>) {
  const t = term.toLowerCase();
  if (
    node.userId.toLowerCase().includes(t) ||
    node.email?.toLowerCase().includes(t) ||
    node.name?.toLowerCase().includes(t)
  ) {
    set.add(node.userId);
  }
  node.children.forEach((child) => collectMatches(child, term, set));
}

function collectAncestorsToExpand(
  node: ReferralTreeNode,
  matched: Set<string>,
  expand: Set<string>,
): boolean {
  let hasMatchInBranch = matched.has(node.userId);
  for (const child of node.children) {
    if (collectAncestorsToExpand(child, matched, expand)) {
      hasMatchInBranch = true;
    }
  }
  if (hasMatchInBranch) {
    expand.add(node.userId);
  }
  return hasMatchInBranch;
}

function TreeNode({
  node,
  level,
  expanded,
  onToggle,
  matched,
}: {
  node: ReferralTreeNode;
  level: number;
  expanded: boolean;
  onToggle: (id: string) => void;
  matched: Set<string>;
}) {
  const hasChildren = node.children.length > 0;
  const isMatched = matched.has(node.userId);
  const color = levelColors[level % 5];
  const badge = badgeColors[level % 5];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => hasChildren && onToggle(node.userId)}
      className={cn(
        "relative flex w-56 flex-col gap-2 rounded-2xl border p-4 shadow-sm transition-all duration-300 md:w-64",
        "bg-linear-to-br backdrop-blur-sm",
        color,
        isMatched && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        "hover:shadow-lg hover:border-white/20",
        hasChildren && "cursor-pointer",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex shrink-0 size-10 items-center justify-center rounded-full",
            "bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20",
          )}
        >
          <Users className="size-5 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">
              {node.name || node.userId.slice(0, 8)}
            </p>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
                level === 0
                  ? "bg-amber-500/20 text-amber-200 border-amber-500/40"
                  : badge,
              )}
            >
              {level === 0 ? "Root" : `L${level}`}
            </span>
          </div>
          {node.email && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {node.email}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{node.directReferrals} direct</span>
            {hasChildren && (
              <span className="ml-auto">{node.children.length} children</span>
            )}
          </div>
        </div>

        {hasChildren && (
          <div className="shrink-0 text-muted-foreground">
            {expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TreeBranch({
  node,
  level,
  onToggle,
  expandedIds,
  matched,
}: {
  node: ReferralTreeNode;
  level: number;
  onToggle: (id: string) => void;
  expandedIds: Set<string>;
  matched: Set<string>;
}) {
  const hasChildren = node.children.length > 0;
  const expanded = expandedIds.has(node.userId);

  return (
    <div className="flex flex-col items-center">
      <TreeNode
        node={node}
        level={level}
        expanded={expanded}
        onToggle={onToggle}
        matched={matched}
      />

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center"
          >
            <div className="h-5 w-px bg-border/60" />
            <div className="h-px w-full max-w-5xl bg-border/60" />
            <div className="flex flex-wrap justify-center gap-8 px-4 pb-4 pt-0">
              {node.children.map((child) => (
                <div key={child.userId} className="flex flex-col items-center">
                  <div className="h-5 w-px bg-border/60" />
                  <TreeBranch
                    node={child}
                    level={level + 1}
                    onToggle={onToggle}
                    expandedIds={expandedIds}
                    matched={matched}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function NetworkTree({ data, className }: NetworkTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const matched = useMemo(() => {
    if (!searchTerm) return new Set<string>();
    const set = new Set<string>();
    collectMatches(data, searchTerm, set);
    return set;
  }, [data, searchTerm]);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    set.add(data.userId);
    return set;
  });

  useMemo(() => {
    if (searchTerm && matched.size > 0) {
      const toExpand = new Set<string>();
      collectAncestorsToExpand(data, matched, toExpand);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        toExpand.forEach((id) => next.add(id));
        return next;
      });
    }
  }, [searchTerm, matched, data]);

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<string>();
    function walk(node: ReferralTreeNode) {
      all.add(node.userId);
      node.children.forEach(walk);
    }
    walk(data);
    setExpandedIds(all);
  };

  const collapseAll = () => {
    setExpandedIds(new Set([data.userId]));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, name or email..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-2xl border border-border/30 p-6">
        <TreeBranch
          node={data}
          level={0}
          onToggle={toggle}
          expandedIds={expandedIds}
          matched={matched}
        />
      </div>
    </div>
  );
}
