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
      className={`relative flex min-h-[228px] flex-col items-center justify-center rounded-[28px] border px-6 py-7 shadow-[0_14px_34px_rgba(0,0,0,0.28)] ${
        isServer
          ? "border-[#D9FF73] bg-[linear-gradient(180deg,#C8F53A_0%,#A7D91A_100%)] text-[#203100] shadow-[0_14px_34px_rgba(200,245,58,0.24)]"
          : "border-[#FFB15F] bg-[linear-gradient(180deg,#FFB85B_0%,#E09134_100%)] text-[#3B2204]"
      }`}
    >
      {isServer ? (
        <span className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(255,255,255,0.28)] text-base">
          🎾
        </span>
      ) : null}
      <span className="text-[102px] font-black leading-none tracking-[-0.05em]">+1</span>
      <span className="mt-3 text-[42px] font-semibold tracking-[-0.04em]">
        {isServer ? "Server" : "Receiver"}
      </span>
    </motion.button>
  );
}
