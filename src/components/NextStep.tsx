import { Link } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import { motion } from "motion/react";
import { isCurrentStep, type NextStep as NextStepData } from "../lib/guidance";
import { usePageMotion } from "./PageTransition";

export default function NextStep({
  step,
  path,
}: {
  step: NextStepData;
  path: string;
}) {
  const here = isCurrentStep(path, step.to);
  const m = usePageMotion();

  return (
    <motion.div
      key={step.to + step.body}
      role="region"
      aria-label="Prochain pas"
      initial={m.initial}
      animate={m.animate}
      transition={m.transition}
      className="border-b border-border bg-primary/8 px-5 py-3.5 lg:px-7"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Compass className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-xs uppercase tracking-[0.14em] text-primary">
              {step.title}
            </div>
            <p className="mt-0.5 text-sm text-foreground">{step.body}</p>
          </div>
        </div>
        {!here && (
          <Link
            to={step.to}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            {step.actionLabel}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
