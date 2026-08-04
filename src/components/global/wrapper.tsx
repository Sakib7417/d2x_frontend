import React from "react";
import { cn } from "@/lib/utils";

interface WrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Max-width page wrapper for the marketing navbar / sections.
 */
const Wrapper: React.FC<WrapperProps> = ({ children, className }) => {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-6 lg:px-8", className)}>
      {children}
    </div>
  );
};

export default Wrapper;
