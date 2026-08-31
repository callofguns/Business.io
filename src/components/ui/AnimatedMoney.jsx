import { useEffect, useState } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { formatMoney } from "../../lib/format";
import { useCurrencyStore } from "../../state/currencyStore";

// A spring-driven counter for money values. Re-targeting `value` mid-flight
// (e.g. two "Next Day" presses in quick succession) simply gives the spring
// a new target — it smoothly redirects instead of snapping or queuing.
export function AnimatedMoney({ value, className, decimals = false }) {
  const currency = useCurrencyStore((s) => s.currency);
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 160, damping: 24, mass: 0.8 });
  const [display, setDisplay] = useState(() => formatMoney(value, { decimals, currency }));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplay(formatMoney(latest, { decimals, currency }));
    });
    return unsubscribe;
  }, [spring, decimals, currency]);

  // Currency changes don't move the spring (the underlying number is the
  // same), so the "change" subscription above won't fire on its own —
  // re-format immediately against the spring's current value.
  useEffect(() => {
    setDisplay(formatMoney(motionValue.get(), { decimals, currency }));
  }, [currency, decimals, motionValue]);

  return <span className={className}>{display}</span>;
}
