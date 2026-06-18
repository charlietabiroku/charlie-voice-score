import { motion } from "framer-motion";

type ServeHeroProps = {
  leftGames: number;
  rightGames: number;
  leftIsServer: boolean;
  rightIsServer: boolean;
  isTiebreak: boolean;
  onTap: () => void;
};

export function ServeHero({
  leftGames,
  rightGames,
  leftIsServer,
  rightIsServer,
  isTiebreak,
  onTap
}: ServeHeroProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onTap}
      className="relative grid min-h-[88px] w-full grid-cols-[1fr_58px_1fr] items-center rounded-[20px] border border-[rgba(198,255,0,0.16)] bg-[linear-gradient(180deg,rgba(58,84,28,0.84)_0%,rgba(34,46,24,0.84)_100%)] px-2.5 py-2 shadow-[0_14px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl sm:min-h-[108px] sm:grid-cols-[1fr_88px_1fr] sm:rounded-[22px] sm:px-4 sm:py-4"
    >
      {isTiebreak ? (
        <span className="absolute right-3 top-3 rounded-full border border-[rgba(200,245,58,0.28)] bg-[rgba(200,245,58,0.14)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E9FF92] sm:right-4 sm:top-4 sm:px-3 sm:text-[11px]">
          TB
        </span>
      ) : null}

      <div className={`flex flex-col items-center ${leftIsServer ? "opacity-100" : "opacity-38"}`}>
        <span className="text-[34px] font-black leading-none tracking-[-0.05em] text-[#D7FF5F] sm:text-[44px]">{leftGames}</span>
        <span
          className={`mt-1.5 h-2.5 w-2.5 rounded-full transition sm:mt-2 ${
            leftIsServer ? "bg-[#C8F53A] shadow-[0_0_18px_rgba(200,245,58,0.95)]" : "bg-transparent"
          }`}
        />
      </div>

      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-[18px] leading-none sm:text-[24px]">🎾</span>
        <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-[#A1B58C] sm:mt-2 sm:text-[10px] sm:tracking-[0.24em]">
          Tap To
        </span>
        <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#A1B58C] sm:text-[10px] sm:tracking-[0.24em]">
          Switch
        </span>
      </div>

      <div className={`flex flex-col items-center ${rightIsServer ? "opacity-100" : "opacity-38"}`}>
        <span className="text-[34px] font-black leading-none tracking-[-0.05em] text-[#D7FF5F] sm:text-[44px]">{rightGames}</span>
        <span
          className={`mt-1.5 h-2.5 w-2.5 rounded-full transition sm:mt-2 ${
            rightIsServer ? "bg-[#C8F53A] shadow-[0_0_18px_rgba(200,245,58,0.95)]" : "bg-transparent"
          }`}
        />
      </div>
    </motion.button>
  );
}
