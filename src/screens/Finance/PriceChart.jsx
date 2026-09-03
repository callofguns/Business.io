// Plain SVG line chart, same shape as BusinessDetail/TrafficChart.jsx but
// generic over { day, price } and colored by trend (good/bad/neutral)
// rather than always brand -- price direction is the point here, traffic
// direction isn't. Sized smaller since it lives inside a card alongside a
// header, holdings line, and trade controls.
const WIDTH = 400;
const HEIGHT = 100;
const PADDING = 8;

const TONE_COLORS = {
  good: "var(--color-good-500)",
  bad: "var(--color-bad-500)",
  neutral: "var(--color-ink-faint)",
};

export function PriceChart({ history, tone = "neutral" }) {
  if (history.length < 2) {
    return (
      <div className="flex h-[80px] items-center justify-center rounded-2xl border border-dashed border-border-strong text-center">
        <p className="max-w-[220px] text-[12px] text-ink-faint">
          Price history builds up over the next few days.
        </p>
      </div>
    );
  }

  const prices = history.map((h) => h.price);
  const max = Math.max(...prices);
  const min = Math.min(...prices);
  const range = max - min || 1;

  const points = history.map((h, i) => {
    const x = PADDING + (i / (history.length - 1)) * (WIDTH - PADDING * 2);
    const y = HEIGHT - PADDING - ((h.price - min) / range) * (HEIGHT - PADDING * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const color = TONE_COLORS[tone] ?? TONE_COLORS.neutral;
  const last = points[points.length - 1];
  const chartLabel = `Price history over the last ${history.length} days, ranging from ${min.toFixed(2)} to ${max.toFixed(2)}, currently ${last.price.toFixed(2)}`;

  return (
    <div className="rounded-2xl border border-border bg-surface-sunken p-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-[80px] w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={chartLabel}
      >
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={last.x} cy={last.y} r="3" fill={color} />
      </svg>
    </div>
  );
}
