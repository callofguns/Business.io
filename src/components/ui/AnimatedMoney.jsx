import { useEffect, useState } from "react";
import { useMotionValue, useSpring } from "framer-motion";
import { formatMoney } from "../../lib/format";

// A spring-driven counter for money values. Re-targeting `value` mid-flight
// (e.g. two "Next Day" presses in quick succession) simply gives the spring
// a new target — it smoothly redirects instead of snapping or queuing.
export function AnimatedMoney({ value, className, decimals = false }) {
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 20, mass: 1 });
  const [display, setDisplay] = useState(() => formatMoney(value, { decimals }));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplay(formatMoney(latest, { decimals }));
    });
    return unsubscribe;
  }, [spring, decimals]);

  return <span className={className}>{display}</span>;
}
