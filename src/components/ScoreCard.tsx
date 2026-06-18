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
    <section className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] px-4 pb-4 pt-3 text-center shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:rounded-[26px] sm:px-5 sm:pb-5 sm:pt-4">
      <div className="mb-1 min-h-[10px] text-center text-[8px] font-semibold uppercase tracking-[0.18em] text-[#70806A] sm:mb-3 sm:min-h-[18px] sm:text-[11px] sm:tracking-[0.22em]">
        {sets.map((set, index) => (
          <span key={`${set.a}-${set.b}-${index}`} className="mx-1.5">
            {set.a}-{set.b}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_1px_1fr] items-center">
        <div className="py-2 text-center sm:py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${leftScore}`}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-[60px] font-black leading-none tracking-[-0.06em] text-white sm:text-[84px]"
            >
              {leftScore}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="h-20 bg-[rgba(255,255,255,0.1)] sm:h-28" />

        <div className="py-2 text-center sm:py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${rightScore}`}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-[60px] font-black leading-none tracking-[-0.06em] text-white sm:text-[84px]"
            >
              {rightScore}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-2 rounded-[16px] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-center text-[16px] font-semibold tracking-[0.14em] text-[#E8EEE5] sm:mt-3 sm:rounded-[18px] sm:px-4 sm:py-3 sm:text-[18px] sm:tracking-[0.18em]">
        {callText}
      </div>
    </section>
  );
}
