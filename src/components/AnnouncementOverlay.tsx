import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Announcement } from "../types";

type AnnouncementOverlayProps = {
  announcement: Announcement | null;
  winnerLabel: string;
  onDismiss: () => void;
  onResetAfterMatch: () => void;
};

const EMOJI = {
  game: "🎾",
  set: "🏆",
  match: "👑"
};

export function AnnouncementOverlay({
  announcement,
  winnerLabel,
  onDismiss,
  onResetAfterMatch
}: AnnouncementOverlayProps) {
  useEffect(() => {
    if (!announcement || announcement.kind === "match") {
      return;
    }

    const timer = window.setTimeout(onDismiss, 2200);
    return () => window.clearTimeout(timer);
  }, [announcement, onDismiss]);

  return (
    <AnimatePresence>
      {announcement ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(4,10,4,0.78)] px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={announcement.kind === "match" ? onResetAfterMatch : onDismiss}
        >
          <motion.div
            initial={{ y: 28, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, scale: 0.98, opacity: 0 }}
            className="w-full max-w-[360px] rounded-[28px] border border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,#293422_0%,#161C15_100%)] px-6 py-8 text-center shadow-[0_24px_50px_rgba(0,0,0,0.45)]"
          >
            <div className="text-[48px]">{EMOJI[announcement.kind]}</div>
            <div className="mt-3 text-[12px] font-semibold uppercase tracking-[0.28em] text-[#98A38E]">
              {announcement.kind}
            </div>
            <div className="mt-2 text-[42px] font-black tracking-[-0.06em] text-white">
              {winnerLabel}
            </div>
            <div className="mt-2 text-[21px] font-semibold tracking-[0.2em] text-[#E4F0DD]">
              {announcement.kind === "match" ? "Champion" : "Takes It"}
            </div>
            <div className="mt-5 text-[14px] font-medium tracking-[0.16em] text-[#9AAA93]">
              {announcement.sets.map((set, index) => (
                <span key={`${set.a}-${set.b}-${index}`} className="mx-1.5">
                  {set.a}-{set.b}
                </span>
              ))}
            </div>
            {announcement.kind === "match" ? (
              <div className="mt-5 text-[12px] uppercase tracking-[0.22em] text-[#90A58E]">
                Tap anywhere to reset
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
