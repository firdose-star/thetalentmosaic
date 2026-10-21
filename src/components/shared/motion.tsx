"use client";

/**
 * Shared entrance animations, so every page moves the same way.
 *
 *   <Stagger className="grid ...">
 *     <StaggerItem>…</StaggerItem>
 *   </Stagger>
 *
 * Children fade up one after another. Keep it subtle: short distance, quick
 * duration. `MotionConfig reducedMotion="user"` in the providers turns this
 * off for anyone who prefers reduced motion.
 */
import { motion, type Variants } from "framer-motion";
import type { ComponentProps } from "react";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function Stagger(props: ComponentProps<typeof motion.div>) {
  return <motion.div variants={container} initial="hidden" animate="show" {...props} />;
}

export function StaggerItem(props: ComponentProps<typeof motion.div>) {
  return <motion.div variants={item} {...props} />;
}

/** A single block that fades up on mount. */
export function FadeIn(props: ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      {...props}
    />
  );
}
