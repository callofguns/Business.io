import { useState } from "react";
import { Sparkles, Landmark, Building2, ArrowRight, ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { Modal } from "../ui/Modal";
import { PillButton } from "../ui/Button";
import { useOnboardingStore } from "../../state/onboardingStore";

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to business.io",
    body: "You've got $50,000 and an empty portfolio. Build it into an empire — one building, one business, one day at a time.",
  },
  {
    icon: Landmark,
    title: "Start with a building",
    body: "Every business needs a location. Head to the Marketplace to lease or buy your first building — retail space for shops and cafés, office space for agencies. Leasing is cheaper up front; buying means never paying rent again.",
  },
  {
    icon: Building2,
    title: "Open for business",
    body: "With a building secured, go to My Empire and start a business in it. Hire staff to raise capacity, set your own prices, and run promotions to pull in more customers.",
  },
  {
    icon: ArrowRight,
    title: "Advance the day",
    body: "Hit Next Day on the Home screen to run the simulation. Each day your businesses earn, rent and wages come out, and taxes accrue. Reinvest the profits into stocks, property and more businesses — and watch your rank climb on the Rivals leaderboard.",
  },
];

// Rendered as a sibling of AppShell in App.jsx, not wrapped around it — see
// the render-loop hang documented at App.jsx re: nesting AnimatePresence.
export function WelcomeModal() {
  const introSeen = useOnboardingStore((s) => s.introSeen);
  const completeIntro = useOnboardingStore((s) => s.completeIntro);
  const [stepIndex, setStepIndex] = useState(0);

  if (introSeen) return null;

  const isLast = stepIndex === STEPS.length - 1;
  const step = STEPS[stepIndex];
  const Icon = step.icon;

  const finish = () => {
    completeIntro();
    setStepIndex(0);
  };

  return (
    <Modal open onClose={finish} title="Getting started" className="max-w-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Icon size={26} strokeWidth={2.25} />
          </span>
          <div>
            <h3 className="text-[17px] font-extrabold tracking-tight text-ink">{step.title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-faint">{step.body}</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={clsx(
                "h-1.5 rounded-full transition-all",
                i === stepIndex ? "w-5 bg-brand-500" : "w-1.5 bg-border-strong"
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {stepIndex > 0 ? (
            <PillButton
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={() => setStepIndex((i) => i - 1)}
            >
              Back
            </PillButton>
          ) : (
            <PillButton variant="ghost" size="md" onClick={finish}>
              Skip
            </PillButton>
          )}
          <PillButton
            size="md"
            className="flex-1"
            icon={isLast ? undefined : ArrowRight}
            onClick={isLast ? finish : () => setStepIndex((i) => i + 1)}
          >
            {isLast ? "Let's go" : "Next"}
          </PillButton>
        </div>
      </div>
    </Modal>
  );
}
