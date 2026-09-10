import { type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

export function usePageMotion() {
  const reduce = useReducedMotion();
  return {
    reduce: !!reduce,
    transition: reduce
      ? { duration: 0 }
      : { duration: 0.25, ease: EASE },
    initial: reduce ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 },
  };
}

export default function PageTransition({
  children,
  k,
}: {
  children: ReactNode;
  k?: string;
}) {
  const location = useLocation();
  const key = k ?? `${location.pathname}${location.search}`;
  const m = usePageMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={m.initial}
        animate={m.animate}
        exit={m.exit}
        transition={m.transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
