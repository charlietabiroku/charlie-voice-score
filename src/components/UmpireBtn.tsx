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
      className={`flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-[24px] border px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${toneClass[tone]}`}
    >
      {icon ? <span className="text-2xl leading-none">{icon}</span> : null}
      <span className="text-[20px] font-semibold tracking-[-0.03em]">{title}</span>
      <span className="text-[12px] font-medium uppercase tracking-[0.18em] opacity-80">{subtitle}</span>
    </motion.button>
  );
}
