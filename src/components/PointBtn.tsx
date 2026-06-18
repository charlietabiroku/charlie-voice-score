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
      className={`relative flex min-h-[170px] flex-col items-center justify-center rounded-[24px] border px-4 py-5 shadow-[0_16px_36px_rgba(0,0,0,0.3)] sm:min-h-[220px] sm:px-6 sm:py-6 ${
        isServer
          ? "border-[#D9FF73] bg-[linear-gradient(180deg,#C8F53A_0%,#A7D91A_100%)] text-[#203100] shadow-[0_14px_34px_rgba(200,245,58,0.24)]"
          : "border-[#FFB15F] bg-[linear-gradient(180deg,#FFB85B_0%,#E09134_100%)] text-[#3B2204]"
      }`}
    >
      {isServer ? (
        <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,255,255,0.28)] text-[16px] sm:right-5 sm:top-5 sm:h-10 sm:w-10 sm:text-[18px]">
          🎾
        </span>
      ) : null}
      <span className="text-[72px] font-black leading-none tracking-[-0.06em] sm:text-[96px]">+1</span>
      <span className="mt-2 text-[28px] font-semibold tracking-[-0.05em] sm:mt-3 sm:text-[38px]">
        {isServer ? "Server" : "Receiver"}
      </span>
    </motion.button>
  );
}
