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
    <section className="rounded-[26px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#21291E_0%,#1B2219_100%)] px-3 pb-3 pt-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_30px_rgba(0,0,0,0.24)] sm:rounded-[28px] sm:px-4 sm:pb-4 sm:pt-3">
      <div className="mb-2 min-h-[14px] text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6D7867] sm:mb-3 sm:min-h-[18px] sm:text-[11px] sm:tracking-[0.22em]">
        {sets.map((set, index) => (
          <span key={`${set.a}-${set.b}-${index}`} className="mx-1.5">
            {set.a}-{set.b}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_1px_1fr] items-center">
        <div className="py-2.5 text-center sm:py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`left-${leftScore}`}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-[60px] font-black leading-none tracking-[-0.07em] text-white sm:text-[88px]"
            >
              {leftScore}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="h-24 bg-[rgba(255,255,255,0.12)] sm:h-30" />

        <div className="py-2.5 text-center sm:py-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={`right-${rightScore}`}
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-[60px] font-black leading-none tracking-[-0.07em] text-white sm:text-[88px]"
            >
              {rightScore}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-2.5 rounded-[16px] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-center text-[14px] font-semibold tracking-[0.12em] text-[#E8EEE5] sm:mt-3 sm:rounded-[18px] sm:px-4 sm:py-3 sm:text-[19px] sm:tracking-[0.18em]">
        {callText}
      </div>
    </section>
  );
}
