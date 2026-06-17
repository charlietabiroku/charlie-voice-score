import { AnimatePresence, motion } from "framer-motion";

type SettingsSheetProps = {
  open: boolean;
  deuceRules: boolean;
  audioOn: boolean;
  vibrationOn: boolean;
  onClose: () => void;
  onToggleDeuce: () => void;
  onToggleAudio: () => void;
  onToggleVibration: () => void;
};

type SwitchRowProps = {
  label: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
};

function SwitchRow({ label, hint, checked, onToggle }: SwitchRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-[20px] bg-[rgba(255,255,255,0.05)] px-4 py-4 text-left"
    >
      <span>
        <span className="block text-[17px] font-semibold tracking-[-0.02em] text-white">{label}</span>
        <span className="mt-1 block text-[12px] uppercase tracking-[0.18em] text-[#93A18D]">{hint}</span>
      </span>
      <span
        className={`relative inline-flex h-8 w-14 items-center rounded-full p-1 transition ${
          checked ? "bg-[#C8F53A]" : "bg-[#394137]"
        }`}
      >
        <span
          className={`h-6 w-6 rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.28)] transition ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

export function SettingsSheet({
  open,
  deuceRules,
  audioOn,
  vibrationOn,
  onClose,
  onToggleDeuce,
  onToggleAudio,
  onToggleVibration
}: SettingsSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-40 bg-[rgba(4,10,4,0.62)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[448px] rounded-t-[32px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#20291E_0%,#131813_100%)] px-5 pb-[calc(env(safe-area-inset-bottom)+22px)] pt-4 shadow-[0_-16px_44px_rgba(0,0,0,0.36)]"
          >
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[rgba(255,255,255,0.18)]" />
            <div className="mb-4 text-center text-[13px] font-semibold uppercase tracking-[0.28em] text-[#A1B199]">
              Settings
            </div>
            <div className="space-y-3">
              <SwitchRow
                label="Deuce rules"
                hint={deuceRules ? "ON" : "OFF"}
                checked={deuceRules}
                onToggle={onToggleDeuce}
              />
              <SwitchRow
                label="Audio calls"
                hint={audioOn ? "ON" : "OFF"}
                checked={audioOn}
                onToggle={onToggleAudio}
              />
              <SwitchRow
                label="Vibration"
                hint={vibrationOn ? "ON" : "OFF"}
                checked={vibrationOn}
                onToggle={onToggleVibration}
              />
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
