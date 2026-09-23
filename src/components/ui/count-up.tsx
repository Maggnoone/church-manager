import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { HOUSE_EASE } from "@/lib/motion";

interface CountUpProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}

const DEFAULT_DURATION = 0.9;

/**
 * Animated numeric counter.
 *
 * SSR-safe: the initial state is the final `value`, so server HTML (and no-JS
 * clients) always render the real number. The count-up animation runs only
 * after mount, and is skipped entirely when the user prefers reduced motion.
 */
export function CountUp({ value, format, duration = DEFAULT_DURATION, className }: CountUpProps) {
  const reduceMotion = useReducedMotion();
  const safeValue = Number.isFinite(value) ? value : 0;
  const [display, setDisplay] = useState(safeValue);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(safeValue);
      return;
    }

    const controls = animate(0, safeValue, {
      duration,
      ease: HOUSE_EASE,
      onUpdate: (latest) => setDisplay(latest),
    });

    return () => controls.stop();
  }, [safeValue, duration, reduceMotion]);

  const text = format ? format(display) : Math.round(display).toLocaleString("es-AR");

  return <span className={className}>{text}</span>;
}
