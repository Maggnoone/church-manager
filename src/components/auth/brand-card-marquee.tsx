import { motion } from "framer-motion";
import {
  BookOpen,
  ClipboardCheck,
  HeartHandshake,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

interface BrandCard {
  icon: LucideIcon;
  label: string;
  value: string;
}

/** Hardcoded, decorative domain previews — no data fetching on the auth screen. */
const CARDS: BrandCard[] = [
  { icon: Users, label: "Confirmandos", value: "128 en formación" },
  { icon: HeartHandshake, label: "Padrinos", value: "96 acompañando" },
  { icon: BookOpen, label: "Charlas", value: "12 programadas" },
  { icon: ClipboardCheck, label: "Asistencia", value: "92% del grupo" },
  { icon: Wallet, label: "Recaudado retiro", value: "$48.500" },
  { icon: Sparkles, label: "Confirmación 2026", value: "40 días" },
];

function rotateCards(cards: BrandCard[], offset: number): BrandCard[] {
  return [...cards.slice(offset), ...cards.slice(0, offset)];
}

interface MarqueeRowProps {
  cards: BrandCard[];
  duration: number;
  reverse?: boolean;
}

const ROWS: MarqueeRowProps[] = [
  { cards: CARDS, duration: 50 },
  { cards: rotateCards(CARDS, 2), duration: 44, reverse: true },
  { cards: rotateCards(CARDS, 4), duration: 52 },
];

function DomainCard({ icon: Icon, label, value }: BrandCard) {
  return (
    <div className="w-[220px] shrink-0 rounded-2xl border border-white/10 bg-white/10 p-4 text-white shadow-elegant backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-white/60">
            {label}
          </p>
          <p className="truncate font-display text-sm font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ cards, duration, reverse = false }: MarqueeRowProps) {
  const loop = [...cards, ...cards];
  const from = reverse ? "-50%" : "0%";
  const to = reverse ? "0%" : "-50%";

  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <motion.div
        className="flex w-max gap-5"
        animate={{ x: [from, to] }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
      >
        {loop.map((card, index) => (
          <DomainCard key={`${card.label}-${index}`} {...card} />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Decorative diagonal field of domain preview cards for the auth brand panel.
 * Renders three rows of "product preview" cards inside a rotated block anchored
 * to the lower-right corner, so the cards appear to flow diagonally.
 */
export function BrandCardMarquee() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none overflow-hidden"
    >
      <div
        className="absolute bottom-[75%] right-[-50%] w-[150%]"
        style={{
          transform: "rotate(-14deg)",
          transformOrigin: "bottom right",
          maskImage: "linear-gradient(300deg, #000 70%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(300deg, #000 70%, transparent 100%)",
        }}
      >
        <div className="flex flex-col gap-5">
          {ROWS.map((row, index) => (
            <MarqueeRow key={`${row.duration}-${index}`} {...row} />
          ))}
        </div>
      </div>
    </div>
  );
}
