"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Users, Search, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import type { ReferralTreeNode } from "@/types/models";

interface NetworkTreeProps {
  data: ReferralTreeNode;
  className?: string;
}

interface TreeNodeProps {
  node: ReferralTreeNode;
  level: number;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  isNodeExpanded: (nodeId: string) => boolean;
  searchTerm: string;
  matchedNodes: Set<string>;
}

const levelColors = [
  "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  "from-purple-500/20 to-pink-500/20 border-purple-500/30",
  "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
  "from-orange-500/20 to-amber-500/20 border-orange-500/30",
  "from-rose-500/20 to-red-500/20 border-rose-500/30",
];

function TreeNode({ node, level, isExpanded, onToggle, isNodeExpanded, searchTerm, matchedNodes }: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isMatched = matchedNodes.has(node.userId);
  const shouldHighlight = searchTerm && isMatched;
  const levelColor = levelColors[level % levelColors.length];

  const nodeVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <motion.div
      variants={nodeVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.3, delay: level * 0.05 }}
      className="relative"
    >
      {/* Connection Line */}
      {level > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-linear-to-b from-border via-border/50 to-transparent" />
      )}

      {/* Node Card */}
      <div className="relative mb-3">
        {/* Horizontal connector */}
        {level > 0 && (
          <div className="absolute left-0 top-1/2 w-4 h-px bg-border" />
        )}

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "relative inline-flex items-center gap-3 rounded-xl border p-4 transition-all duration-300",
            "bg-linear-to-br backdrop-blur-sm",
            levelColor,
            shouldHighlight && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            "hover:shadow-lg"
          )}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(node.userId)}
              className="h-8 w-8 p-0 shrink-0"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="size-4" />
              </motion.div>
            </Button>
          )}

          {/* Node Content */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className={cn(
              "flex shrink-0 size-10 items-center justify-center rounded-full",
              "bg-linear-to-br from-primary/20 to-primary/5",
              "border border-primary/20"
            )}>
              <Users className="size-5 text-primary" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">
                  {node.name || node.userId.slice(0, 8)}
                </p>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  "bg-primary/10 text-primary"
                )}>
                  L{level}
                </span>
              </div>
              {node.email && (
                <p className="text-muted-foreground text-xs truncate mt-0.5">
                  {node.email}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-muted-foreground text-xs">
                  {node.directReferrals} direct
                </span>
                {hasChildren && (
                  <span className="text-muted-foreground text-xs">
                    {node.children.length} children
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Glow effect */}
          <div className={cn(
            "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300",
            "bg-linear-to-r from-transparent via-white/10 to-transparent",
            "pointer-events-none",
            "group-hover:opacity-100"
          )} />
        </motion.div>
      </div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="ml-6 pl-6 border-l border-border/30"
          >
            {node.children.map((child) => (
              <TreeNode
                key={child.userId}
                node={child}
                level={level + 1}
                isExpanded={isNodeExpanded(child.userId)}
                onToggle={onToggle}
                isNodeExpanded={isNodeExpanded}
                searchTerm={searchTerm}
                matchedNodes={matchedNodes}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function NetworkTree({ data, className }: NetworkTreeProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([data.userId]));
  const [zoom, setZoom] = useState(1);

  // Find all nodes matching search term
  const matchedNodes = useMemo(() => {
    if (!searchTerm) return new Set<string>();
    
    const matches = new Set<string>();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    function searchNode(node: ReferralTreeNode) {
      if (
        node.userId.toLowerCase().includes(lowerSearchTerm) ||
        node.email?.toLowerCase().includes(lowerSearchTerm) ||
        node.name?.toLowerCase().includes(lowerSearchTerm)
      ) {
        matches.add(node.userId);
      }
      node.children.forEach(searchNode);
    }
    
    searchNode(data);
    return matches;
  }, [data, searchTerm]);

  // Auto-expand paths to matched nodes
  useMemo(() => {
    if (searchTerm && matchedNodes.size > 0) {
      const pathsToExpand = new Set<string>();
      
      function findPath(node: ReferralTreeNode, path: string[]): boolean {
        const currentPath = [...path, node.userId];
        
        if (matchedNodes.has(node.userId)) {
          path.forEach(id => pathsToExpand.add(id));
          return true;
        }
        
        for (const child of node.children) {
          if (findPath(child, currentPath)) {
            pathsToExpand.add(node.userId);
            return true;
          }
        }
        
        return false;
      }
      
      findPath(data, []);
      setExpandedNodes(pathsToExpand);
    }
  }, [searchTerm, matchedNodes, data]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const isNodeExpanded = (nodeId: string) => expandedNodes.has(nodeId);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search members by ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="size-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                disabled={zoom >= 2}
              >
                <ZoomIn className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(1)}
              >
                <Maximize2 className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tree Container */}
      <motion.div
        animate={{ scale: zoom }}
        transition={{ duration: 0.2 }}
        className="origin-top"
      >
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <TreeNode
                node={data}
                level={0}
                isExpanded={isNodeExpanded(data.userId)}
                onToggle={toggleNode}
                isNodeExpanded={isNodeExpanded}
                searchTerm={searchTerm}
                matchedNodes={matchedNodes}
              />
            </div>

            {/* Empty State */}
            {!searchTerm && data.children.length === 0 && (
              <div className="text-center py-12">
                <Users className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No network members yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Share your referral link to start building your network
                </p>
              </div>
            )}

            {/* No Results */}
            {searchTerm && matchedNodes.size === 0 && (
              <div className="text-center py-12">
                <Search className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No members found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try a different search term
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
