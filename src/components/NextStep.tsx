import { useEffect, useId } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Compass } from "lucide-react";
import { isCurrentStep, type NextStep as NextStepData } from "../lib/guidance";

export default function NextStepModal({
  step,
  path,
  open,
  onClose,
}: {
  step: NextStepData;
  path: string;
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const navigate = useNavigate();
  const here = isCurrentStep(path, step.to);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/25"
        aria-label="Fermer le prochain pas"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-[16px] border border-border bg-panel p-5"
      >
        <div className="flex size-11 items-center justify-center rounded-[16px] bg-background text-foreground">
          <Compass className="size-4" />
        </div>
        <p className="landing-eyebrow mt-4 text-foreground">{step.title}</p>
        <h2 id={titleId} className="app-heading mt-2 text-[24px] text-foreground">
          Un rappel pour avancer
        </h2>
        <p className="mt-2 text-[16px] leading-normal tracking-[-0.18px] text-muted">
          {step.body}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {!here && (
            <button
              type="button"
              className="landing-btn landing-btn-fill min-h-12 flex-1"
              onClick={() => {
                onClose();
                navigate(step.to);
              }}
            >
              {step.actionLabel}
              <ArrowRight className="size-4" />
            </button>
          )}
          <button
            type="button"
            className="landing-btn landing-btn-outline min-h-12 flex-1"
            onClick={onClose}
          >
            {here ? "Compris" : "Plus tard"}
          </button>
        </div>
      </div>
    </div>
  );
}
