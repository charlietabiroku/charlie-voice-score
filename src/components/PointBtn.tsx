import { motion } from "framer-motion";

type PointBtnProps = {
  side: "server" | "receiver";
  onClick: () => void;
};

export function PointBtn({ side, onClick }: PointBtnProps) {
  const isServer = side === "server";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.89 }}
      onClick={onClick}
      className={`relative flex min-h-[176px] flex-col items-center justify-center rounded-[24px] border px-4 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.24)] sm:min-h-[220px] sm:px-6 sm:py-6 ${
        isServer
          ? "border-[rgba(198,255,0,0.28)] bg-[linear-gradient(180deg,#C6FF00_0%,#7CB342_100%)] text-[#132100]"
          : "border-[rgba(255,183,77,0.28)] bg-[linear-gradient(180deg,#FFB74D_0%,#FB8C00_100%)] text-[#2F1900]"
      }`}
    >
      {isServer ? (
        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.22)] text-[14px] sm:right-5 sm:top-5 sm:h-10 sm:w-10 sm:text-[18px]">
          🎾
        </span>
      ) : null}
      <span className="text-[62px] font-black leading-none tracking-[-0.06em] sm:text-[88px]">+1</span>
      <span className="mt-1 text-[22px] font-bold tracking-[-0.05em] sm:mt-3 sm:text-[34px]">
        {isServer ? "Server" : "Receiver"}
      </span>
    </motion.button>
  );
}
