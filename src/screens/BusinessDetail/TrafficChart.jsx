// Plain SVG line chart -- no charting dependency in the project, and this
// is the only chart in the app so far. `history` is business.trafficHistory,
// [{ day, visitors }], oldest first, already capped to the last 30 entries
// by gameStore.nextDay().
const WIDTH = 600;
const HEIGHT = 160;
const PADDING = 10;

export function TrafficChart({ history }) {
  if (history.length < 2) {
    return (
      <div className="flex h-[160px] items-center justify-center rounded-2xl border border-dashed border-border-strong text-center">
        <p className="max-w-[240px] text-[13px] text-ink-faint">
          Traffic history will appear here after your next couple of days in business.
        </p>
      </div>
    );
  }

  const visitors = history.map((h) => h.visitors);
  const max = Math.max(...visitors);
  const min = Math.min(...visitors);
  const range = max - min || 1;

  const points = history.map((h, i) => {
    const x = PADDING + (i / (history.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - ((h.visitors - min) / range) * (HEIGHT - PADDING * 2);
    return { x, y, ...h };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${HEIGHT - PADDING} L ${points[0].x} ${HEIGHT - PADDING} Z`;
  const last = points[points.length - 1];
  const chartLabel = `Daily visitor traffic from day ${history[0].day} to day ${last.day}, ranging from ${min} to ${max}, most recently ${last.visitors}`;

  return (
    <div className="rounded-2xl border border-border bg-surface-sunken p-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-[160px] w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={chartLabel}
      >
        <defs>
          <linearGradient id="traffic-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#traffic-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-brand-500)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={last.x} cy={last.y} r="4" fill="var(--color-brand-500)" />
      </svg>
      <div className="mt-1 flex items-center justify-between text-[11px] font-medium text-ink-faint">
        <span>Day {history[0].day}</span>
        <span>Day {last.day}</span>
      </div>
    </div>
  );
}
