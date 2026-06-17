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
      className="relative grid min-h-[124px] w-full grid-cols-[1fr_88px_1fr] items-center rounded-[28px] border border-[rgba(200,245,58,0.18)] bg-[radial-gradient(circle_at_20%_10%,rgba(200,245,58,0.22),transparent_40%),linear-gradient(180deg,rgba(39,53,24,0.96)_0%,rgba(30,36,24,0.96)_100%)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_34px_rgba(0,0,0,0.28)]"
    >
      {isTiebreak ? (
        <span className="absolute right-4 top-4 rounded-full border border-[rgba(200,245,58,0.28)] bg-[rgba(200,245,58,0.14)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#E9FF92]">
          TB
        </span>
      ) : null}

      <div className={`flex flex-col items-center ${leftIsServer ? "opacity-100" : "opacity-38"}`}>
        <span className="text-[52px] font-black leading-none tracking-[-0.05em] text-[#D7FF5F]">{leftGames}</span>
        <span
          className={`mt-2 h-2.5 w-2.5 rounded-full transition ${
            leftIsServer ? "bg-[#C8F53A] shadow-[0_0_18px_rgba(200,245,58,0.95)]" : "bg-transparent"
          }`}
        />
      </div>

      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-[30px] leading-none">🎾</span>
        <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7E8B73]">
          Tap To
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7E8B73]">
          Switch
        </span>
      </div>

      <div className={`flex flex-col items-center ${rightIsServer ? "opacity-100" : "opacity-38"}`}>
        <span className="text-[52px] font-black leading-none tracking-[-0.05em] text-[#D7FF5F]">{rightGames}</span>
        <span
          className={`mt-2 h-2.5 w-2.5 rounded-full transition ${
            rightIsServer ? "bg-[#C8F53A] shadow-[0_0_18px_rgba(200,245,58,0.95)]" : "bg-transparent"
          }`}
        />
      </div>
    </motion.button>
  );
}
