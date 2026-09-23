import { motion, MotionConfig } from "framer-motion";
import { Sparkles } from "lucide-react";
import { BrandCardMarquee } from "./brand-card-marquee";

/**
 * Brand panel for the auth split layout — desktop only (`lg` and up).
 * Always renders on a dark teal surface; all content is visible without JS.
 *
 * `MotionConfig reducedMotion="user"` suppresses transform/layout animations for
 * reduced-motion users without branching the DOM, so SSR and hydration match.
 * Opacity keyframes are NOT covered by that setting; hide purely decorative
 * layers with the CSS `motion-reduce:hidden` utility instead.
 */
export function AuthBrandPanel() {
  return (
    <MotionConfig reducedMotion="user">
      <div
        className="relative isolate hidden flex-1 overflow-hidden rounded-[28px] lg:block"
        style={{
          background: "linear-gradient(150deg, #0f766e 0%, #0c3b36 48%, #08120f 100%)",
        }}
      >
        {/* Ambient glows — rendered unconditionally; hidden via CSS for reduced motion */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-primary/30 blur-3xl motion-reduce:hidden"
          animate={{ x: [0, 40, 0], y: [0, 25, 0], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-32 h-[460px] w-[460px] rounded-full bg-primary/30 blur-3xl motion-reduce:hidden"
          animate={{ x: [0, -30, 0], y: [0, -40, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Decorative domain cards */}
        <BrandCardMarquee />

        {/* Legibility wash so the copy stays readable over the cards */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#08120f]/50 via-[#08120f]/10 to-transparent"
        />

        {/* Content */}
        <div className="relative z-10 flex h-full flex-col justify-end p-10">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/85 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Movimiento Esperanza de San Pablo
          </span>
          <h2 className="mt-6 max-w-[540px] font-serif text-[44px] italic leading-[1.05] text-white xl:text-[56px]">
            Una Confirmación de Fe
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70">
            Acompañamos la formación de los confirmandos y sus padrinos, paso a paso.
          </p>
        </div>
      </div>
    </MotionConfig>
  );
}
