import { AnimatePresence, motion } from "framer-motion";
import type { SetScore } from "../types";

type ScoreCardProps = {
  leftScore: string;
  rightScore: string;
  callText: string;
  sets: SetScore[];
};

export function ScoreCard({
  leftScore,
  rightScore,
  callText,
  sets
}: ScoreCardProps) {
  return (
    <section className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#21291E_0%,#1B2219_100%)] px-4 pb-4 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_30px_rgba(0,0,0,0.24)]">
      <div className="mb-3 min-h-[18px] text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6D7867]">
        {sets.map((set, index) => (
          <span key={`${set.a}-${set.b}-${index}`} className="mx-1.5">
            {set.a}-{set.b}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_1px_1fr] items-center">
        <div className="py-3 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${leftScore}`}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-[88px] font-black leading-none tracking-[-0.07em] text-white"
            >
              {leftScore}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="h-30 bg-[rgba(255,255,255,0.12)]" />

        <div className="py-3 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${rightScore}`}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-[88px] font-black leading-none tracking-[-0.07em] text-white"
            >
              {rightScore}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 rounded-[18px] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-center text-[19px] font-semibold tracking-[0.18em] text-[#E8EEE5]">
        {callText}
      </div>
    </section>
  );
}
