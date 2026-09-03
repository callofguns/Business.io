import { useState } from "react";
import { ArrowRight, Wallet, Newspaper, ShoppingBag } from "lucide-react";
import { useGameStore } from "../../state/gameStore";
import { useAuthStore } from "../../state/authStore";
import { useUiStore } from "../../state/uiStore";
import { Card, SectionHeading } from "../../components/ui/Card";
import { PillButton } from "../../components/ui/Button";
import { AnimatedMoney } from "../../components/ui/AnimatedMoney";
import { Page } from "../../components/layout/Page";
import { WeekdayStrip } from "./WeekdayStrip";
import { NewsFeed } from "./NewsFeed";
import { DaySummaryModal } from "./DaySummaryModal";

export function Home() {
  const day = useGameStore((s) => s.day);
  const playerName = useAuthStore((s) => s.playerName);
  const bankBalance = useGameStore((s) => s.bankBalance);
  const news = useGameStore((s) => s.news);
  const businessCount = useGameStore((s) => s.businesses.length);
  const nextDay = useGameStore((s) => s.nextDay);
  const setScreen = useUiStore((s) => s.setScreen);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const handleNextDay = () => {
    nextDay();
    setSummaryOpen(true);
  };

  return (
    <Page maxWidth="5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[15px] font-medium text-ink-faint">Welcome,</p>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">{playerName}</h1>
        </div>
        <div className="rounded-2xl border border-border bg-surface px-4 py-2 text-right">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Day</p>
          <p className="text-[22px] font-extrabold leading-tight text-ink">{day}</p>
        </div>
      </div>

      {businessCount === 0 ? (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-dashed">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <ShoppingBag size={18} strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-[14px] font-bold text-ink">You don't own any businesses yet</p>
              <p className="text-[12.5px] text-ink-faint">
                Lease or buy a building in the Marketplace to open your first one.
              </p>
            </div>
          </div>
          <PillButton size="sm" onClick={() => setScreen("marketplace")}>
            Open Marketplace
          </PillButton>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr] xl:items-start">
        <div className="flex flex-col gap-6">
          <Card>
            <PillButton
              icon={ArrowRight}
              size="lg"
              className="w-full"
              onClick={handleNextDay}
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

        <Card className="xl:min-h-[520px]">
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

      <DaySummaryModal open={summaryOpen} onClose={() => setSummaryOpen(false)} />
    </Page>
  );
}
