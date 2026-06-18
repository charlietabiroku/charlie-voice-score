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
  fault: "border-[rgba(255,162,118,0.22)] bg-[linear-gradient(180deg,#FF7043_0%,#BF360C_100%)] text-white",
  neutral: "border-[rgba(164,184,195,0.18)] bg-[linear-gradient(180deg,#455A64_0%,#263238_100%)] text-white"
};

export function UmpireBtn({ title, subtitle, icon, tone, onClick }: UmpireBtnProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`flex min-h-[82px] flex-col items-center justify-center gap-0.5 rounded-[16px] border px-2 py-2 text-center shadow-[0_12px_26px_rgba(0,0,0,0.18)] sm:min-h-[96px] sm:gap-1 sm:rounded-[18px] sm:px-4 sm:py-4 ${toneClass[tone]}`}
    >
      {icon ? <span className="mb-0.5 text-[24px] leading-none sm:mb-1 sm:text-[32px]">{icon}</span> : null}
      <span className="text-[18px] font-semibold tracking-[-0.03em] sm:text-[20px]">{title}</span>
      <span className="text-[10px] font-medium tracking-[-0.01em] opacity-80 sm:text-[11px]">{subtitle}</span>
    </motion.button>
  );
}
