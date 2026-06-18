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
      className={`relative flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border px-6 py-6 shadow-[0_16px_36px_rgba(0,0,0,0.3)] ${
        isServer
          ? "border-[#D9FF73] bg-[linear-gradient(180deg,#C8F53A_0%,#A7D91A_100%)] text-[#203100] shadow-[0_14px_34px_rgba(200,245,58,0.24)]"
          : "border-[#FFB15F] bg-[linear-gradient(180deg,#FFB85B_0%,#E09134_100%)] text-[#3B2204]"
      }`}
    >
      {isServer ? (
        <span className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,255,255,0.28)] text-[18px]">
          🎾
        </span>
      ) : null}
      <span className="text-[96px] font-black leading-none tracking-[-0.06em]">+1</span>
      <span className="mt-3 text-[38px] font-semibold tracking-[-0.05em]">
        {isServer ? "Server" : "Receiver"}
      </span>
    </motion.button>
  );
}
