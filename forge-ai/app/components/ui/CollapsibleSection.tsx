"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/app/utils/cn";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function CollapsibleSection({
  title,
  subtitle,
  icon,
  badge,
  defaultOpen = true,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  React.useEffect(() => {
    const handleExpand = () => {
      setIsOpen(true);
    };
    window.addEventListener("expand-sections", handleExpand);
    return () => window.removeEventListener("expand-sections", handleExpand);
  }, []);

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden transition-all duration-300 hover:border-[var(--border-strong)]",
        className
      )}
    >
      {/* Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left select-none cursor-pointer focus:outline-none hover:bg-[var(--bg-elevated)] transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <div className="text-[var(--text-secondary)] flex-shrink-0">{icon}</div>}
          <div className="min-w-0">
            <h3 className="font-mono text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              {title}
              {badge && <span className="normal-case tracking-normal">{badge}</span>}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate font-sans">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-[var(--text-secondary)] ml-3 flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.2, delay: 0.05 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.15 },
              },
            }}
            className="overflow-hidden border-t border-[var(--border)]"
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
