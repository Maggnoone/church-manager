import type { Transition, Variants } from "framer-motion";

/** Shared easing curve for the app's motion language. */
export const HOUSE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Canonical durations (in seconds) for each motion surface. */
export const DURATIONS = {
  page: 0.25,
  modal: 0.2,
  popover: 0.18,
} as const;

/** Spring used for interactive UI elements. */
export const springUI: Transition = { type: "spring", duration: 0.4, bounce: 0.18 };

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATIONS.page, ease: HOUSE_EASE },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: DURATIONS.page, ease: HOUSE_EASE },
  },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATIONS.modal, ease: HOUSE_EASE },
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.98,
    transition: { duration: DURATIONS.modal, ease: HOUSE_EASE },
  },
};

export const popoverVariants: Variants = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATIONS.popover, ease: HOUSE_EASE },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.98,
    transition: { duration: DURATIONS.popover, ease: HOUSE_EASE },
  },
};

export const fadeUpVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: HOUSE_EASE },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: HOUSE_EASE },
  },
};
