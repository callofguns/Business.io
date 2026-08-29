import { ArrowRight, Wallet, Newspaper } from "lucide-react";
import { useGameStore } from "../../state/gameStore";
import { useAuthStore } from "../../state/authStore";
import { Card, SectionHeading } from "../../components/ui/Card";
import { PillButton } from "../../components/ui/Button";
import { AnimatedMoney } from "../../components/ui/AnimatedMoney";
import { WeekdayStrip } from "./WeekdayStrip";
import { NewsFeed } from "./NewsFeed";

export function Home() {
  const day = useGameStore((s) => s.day);
  const playerName = useAuthStore((s) => s.playerName);
  const bankBalance = useGameStore((s) => s.bankBalance);
  const news = useGameStore((s) => s.news);
  const nextDay = useGameStore((s) => s.nextDay);

  return (
    <div className="mx-auto max-w-5xl px-10 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-[15px] font-medium text-ink-faint">Welcome,</p>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">{playerName}</h1>
        </div>
        <div className="rounded-2xl border border-border bg-surface px-4 py-2 text-right">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Day</p>
          <p className="text-[22px] font-extrabold leading-tight text-ink">{day}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <Card>
            <PillButton
              icon={ArrowRight}
              size="lg"
              className="w-full"
              onClick={nextDay}
            >
              Next Day
            </PillButton>
            <div className="mt-5">
              <WeekdayStrip day={day} />
            </div>
          </Card>

          <Card>
            <SectionHeading icon={Wallet} title="Finances" subtitle="Your financial overview" />
            <div className="rounded-2xl bg-surface-sunken px-4 py-4">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-faint">
                Bank Balance
              </p>
              <AnimatedMoney
                value={bankBalance}
                className="text-[30px] font-extrabold tracking-tight text-ink"
              />
            </div>
          </Card>
        </div>

        <Card className="lg:min-h-[520px]">
          <SectionHeading
            icon={Newspaper}
            iconTone="warn"
            title="Market News"
            subtitle="Latest business updates"
          />
          <div className="app-scroll max-h-[560px] overflow-y-auto pr-1">
            <NewsFeed entries={news} currentDay={day} />
          </div>
        </Card>
      </div>
    </div>
  );
}
