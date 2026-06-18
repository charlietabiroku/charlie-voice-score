import { motion } from "framer-motion";
import type { ReactNode } from "react";

type UmpireBtnProps = {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  tone: "fault" | "neutral";
  onClick: () => void;
};

const toneClass = {
  fault: "border-[#B86A1C] bg-[linear-gradient(180deg,#7B3E12_0%,#6A3411_100%)] text-[#FFD7AA]",
  neutral: "border-[#35465D] bg-[linear-gradient(180deg,#1F3047_0%,#1D2737_100%)] text-[#D5E4FF]"
};

export function UmpireBtn({ title, subtitle, icon, tone, onClick }: UmpireBtnProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`flex min-h-[88px] flex-col items-center justify-center gap-0.5 rounded-[22px] border px-2.5 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:min-h-[118px] sm:gap-1.5 sm:rounded-[24px] sm:px-4 sm:py-4 ${toneClass[tone]}`}
    >
      {icon ? <span className="mb-0.5 text-[30px] leading-none sm:mb-1 sm:text-[44px]">{icon}</span> : null}
      <span className="text-[18px] font-semibold tracking-[-0.03em] sm:text-[23px]">{title}</span>
      <span className="text-[10px] font-medium tracking-[-0.01em] opacity-80 sm:text-[12px]">{subtitle}</span>
    </motion.button>
  );
}
