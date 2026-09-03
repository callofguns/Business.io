import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useAuthStore } from "../../state/authStore";
import { PillButton } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

const cardTransition = { type: "spring", stiffness: 460, damping: 30, mass: 0.6 };

export function Login() {
  const login = useAuthStore((s) => s.login);
  const [name, setName] = useState("");
  const canSubmit = name.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) login(name);
  };

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-surface-sunken px-6">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={cardTransition}
        className="w-full max-w-sm"
      >
        <Card className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-2xl">
            <span aria-hidden="true">🏙️</span>
          </div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">business.io</h1>
          <p className="mt-1 text-[14px] text-ink-faint">
            Build your empire. What should we call you?
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <label htmlFor="player-name" className="sr-only">
              Your name
            </label>
            <input
              id="player-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={24}
              className="h-12 rounded-2xl border border-border-strong bg-surface-sunken px-4 text-center text-[15px] font-semibold text-ink placeholder:font-normal placeholder:text-ink-faint focus:border-brand-500 focus:outline-none"
            />
            <PillButton
              type="submit"
              icon={ArrowRight}
              size="lg"
              disabled={!canSubmit}
              title={canSubmit ? undefined : "Enter a name to continue"}
              className="w-full"
            >
              Get Started
            </PillButton>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
