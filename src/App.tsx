import { startTransition, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { audioEngine } from "./audio";
import { AnnouncementOverlay } from "./components/AnnouncementOverlay";
import { PointBtn } from "./components/PointBtn";
import { ScoreCard } from "./components/ScoreCard";
import { ServeHero } from "./components/ServeHero";
import { SettingsSheet } from "./components/SettingsSheet";
import { UmpireBtn } from "./components/UmpireBtn";
import {
  COOLDOWN_MS,
  awardPoint,
  createInitialSnap,
  getScoreCall,
  getServerFirstValues,
  otherPlayer
} from "./scoring";
import type {
  Announcement,
  AudioKey,
  AudioStatus,
  HistoryEntry,
  MatchSnap,
  Player
} from "./types";

function BrandBadge() {
  return (
    <span className="relative flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[rgba(198,255,0,0.4)] bg-[rgba(8,18,11,0.9)] shadow-[0_0_28px_rgba(198,255,0,0.18)]">
      <span className="h-7 w-7 rounded-full bg-[radial-gradient(circle_at_30%_25%,#F1FF9F_0%,#C6FF00_58%,#7CB342_100%)]" />
      <span className="absolute inset-y-[8px] left-[13px] w-[2px] rounded-full bg-white/90" />
      <span className="absolute inset-y-[8px] right-[13px] w-[2px] rounded-full bg-white/90" />
    </span>
  );
}

function FaultIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4.2 20 18a1 1 0 0 1-.86 1.5H4.86A1 1 0 0 1 4 18l8-13.8Z" />
      <path d="M12 9v5.2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v6h-6" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M9 8H5v4" />
      <path d="M5 12a7 7 0 1 0 2.05-4.95L5 8" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function haptic(pattern: number | number[], enabled: boolean) {
  if (!enabled || typeof navigator === "undefined" || !("vibrate" in navigator)) {
    return;
  }

  navigator.vibrate(pattern);
}

function pointDisplay(value: number, opponent: number, deuceRules: boolean, isTiebreak: boolean) {
  if (isTiebreak) {
    return String(value);
  }

  if (deuceRules && value >= 3 && opponent >= 3) {
    if (value === opponent) {
      return "40";
    }
    if (value > opponent) {
      return "AD";
    }
  }

  return ["0", "15", "30", "40"][Math.min(value, 3)] ?? "40";
}

export default function App() {
  const [snap, setSnap] = useState<MatchSnap>(() => createInitialSnap());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [faultCount, setFaultCount] = useState(0);
  const [deuceRules, setDeuceRules] = useState(true);
  const [tiebreakEnabled, setTiebreakEnabled] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("locked");
  const [vibrationOn, setVibrationOn] = useState(true);
  const [volumeBoost, setVolumeBoost] = useState<2 | 4>(2);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const lastTapRef = useRef(0);
  const announcedAtRef = useRef<number | null>(null);
  const audioOnRef = useRef(audioOn);

  useEffect(() => {
    return audioEngine.subscribe(setAudioStatus);
  }, []);

  useEffect(() => {
    audioOnRef.current = audioOn;
    audioEngine.setAudioEnabled(audioOn);
  }, [audioOn]);

  useEffect(() => {
    audioEngine.setGainMultiplier(volumeBoost);
  }, [volumeBoost]);

  const [leftGames, rightGames] = getServerFirstValues(snap.server, snap.ga, snap.gb);
  const callLabel = getScoreCall(snap, deuceRules);
  const [serverPointValue, receiverPointValue] = snap.isTiebreak
    ? getServerFirstValues(snap.server, snap.tbPa, snap.tbPb)
    : getServerFirstValues(snap.server, snap.pa, snap.pb);
  const leftPoint = pointDisplay(serverPointValue, receiverPointValue, deuceRules, snap.isTiebreak);
  const rightPoint = pointDisplay(receiverPointValue, serverPointValue, deuceRules, snap.isTiebreak);
  const audioButtonLabel = !audioOn ? "Audio" : audioStatus === "loading" ? "Loading" : "Audio";
  const volumeButtonLabel = `${volumeBoost === 4 ? "🔊" : "🔈"} VOL`;

  function unlockAudio() {
    if (!audioOnRef.current) {
      setAudioOn(true);
    }
    void audioEngine.unlockAndPreload();
  }

  function commit(nextSnap: MatchSnap, nextFaultCount: number) {
    setHistory((prev) => [...prev, { snap: structuredClone(snap), faultCount }]);
    setSnap(nextSnap);
    setFaultCount(nextFaultCount);
  }

  function guardedTap(fn: () => void) {
    const now = Date.now();
    if (now - lastTapRef.current < COOLDOWN_MS) {
      return;
    }
    lastTapRef.current = now;
    unlockAudio();
    fn();
  }

  function runScoring(winner: Player, audioLead: AudioKey[] = []) {
    const result = awardPoint(snap, winner, deuceRules, tiebreakEnabled);
    commit(result.snap, 0);

    if (audioOnRef.current) {
      const chain = [...audioLead];
      if (result.audioChain?.length) {
        chain.push(...result.audioChain);
      } else if (result.pointCall.audioKey) {
        chain.push(result.pointCall.audioKey);
      }
      if (chain.length > 0) {
        audioEngine.playChained(chain);
      }
    }

    if (result.event && announcedAtRef.current !== result.event.id) {
      announcedAtRef.current = result.event.id;
      const nextAnnouncement = result.event;
      startTransition(() => setAnnouncement(nextAnnouncement));
    }

    if (result.event?.kind === "match") {
      haptic([80, 40, 80, 40, 120], vibrationOn);
    } else if (result.event?.kind === "game" || result.event?.kind === "set") {
      haptic([40, 20, 40], vibrationOn);
    } else {
      haptic(12, vibrationOn);
    }
  }

  function handleFault() {
    guardedTap(() => {
      if (faultCount === 0) {
        setHistory((prev) => [...prev, { snap: structuredClone(snap), faultCount }]);
        setFaultCount(1);
        if (audioOnRef.current) {
          audioEngine.playSound("fault");
        }
        haptic(8, vibrationOn);
        return;
      }

      runScoring(otherPlayer(snap.server), ["fault"]);
    });
  }

  function handleLet() {
    guardedTap(() => {
      if (audioOnRef.current) {
        audioEngine.playSound("let");
      }
      haptic(8, vibrationOn);
    });
  }

  function handlePoint(winner: Player) {
    guardedTap(() => runScoring(winner));
  }

  function handleUndo() {
    guardedTap(() => {
      setHistory((prev) => {
        const last = prev.at(-1);
        if (!last) {
          return prev;
        }

        setSnap(last.snap);
        setFaultCount(last.faultCount);
        setAnnouncement(null);
        return prev.slice(0, -1);
      });
      haptic(8, vibrationOn);
    });
  }

  function resetMatch() {
    setSnap(createInitialSnap());
    setHistory([]);
    setFaultCount(0);
    setAnnouncement(null);
    announcedAtRef.current = null;
  }

  function handleReset() {
    guardedTap(() => {
      setHistory((prev) => [...prev, { snap: structuredClone(snap), faultCount }]);
      resetMatch();
      haptic(8, vibrationOn);
    });
  }

  return (
    <main className="flex min-h-dvh items-start justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,#0f2d1f_0%,#050b07_62%)] px-2 py-2 text-white sm:px-3 sm:py-3 sm:items-center">
      <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-1.5 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-[calc(env(safe-area-inset-top)+8px)] sm:h-dvh sm:max-w-[448px] sm:overflow-hidden sm:rounded-[34px] sm:px-3 sm:pb-[calc(env(safe-area-inset-bottom)+12px)] sm:pt-[calc(env(safe-area-inset-top)+10px)]">
        <header className="mb-2.5 text-center sm:mb-3">
          <div className="flex items-center justify-center gap-2">
            <BrandBadge />
            <div>
              <div className="text-[19px] font-black tracking-[-0.04em] text-white sm:text-[22px]">
                Charlie Voice Score
              </div>
              <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#B7CC74] sm:text-[10px]">
                Real-Time Tennis Umpire
              </div>
            </div>
          </div>
        </header>

        <div className="mb-2 grid grid-cols-3 gap-2 sm:mb-3">
          <button
            type="button"
            onClick={unlockAudio}
            className="flex h-[44px] items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-[12px] font-medium text-[#D5DDD1] backdrop-blur-md"
          >
            <span>{audioButtonLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setVolumeBoost((prev) => (prev === 2 ? 4 : 2))}
            className="flex h-[44px] items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-[12px] font-medium text-[#D5DDD1] backdrop-blur-md"
          >
            <span>{volumeButtonLabel}</span>
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-[44px] items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] text-[12px] font-medium text-[#D5DDD1] backdrop-blur-md"
          >
            <span>Mode</span>
          </button>
        </div>

        <div className="hidden">
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={unlockAudio}
              className="flex h-[40px] min-w-[74px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-2 text-[8.5px] font-medium tracking-[-0.02em] text-[#C5CCC0] sm:h-[52px] sm:min-w-[102px] sm:px-4 sm:text-[11px]"
            >
              <span>{audioButtonLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => setVolumeBoost((prev) => (prev === 2 ? 4 : 2))}
              className="flex h-[40px] min-w-[74px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-2 text-[8.5px] font-medium tracking-[-0.02em] text-[#C5CCC0] sm:h-[52px] sm:min-w-[102px] sm:px-4 sm:text-[11px]"
            >
              <span>{volumeButtonLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="grid h-[40px] w-[40px] place-items-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-[13px] text-[#C5CCC0] sm:h-[52px] sm:w-[52px] sm:text-[18px]"
            >
              ⚙
            </button>
          </div>
        </div>

        <ServeHero
          leftGames={leftGames}
          rightGames={rightGames}
          leftIsServer
          rightIsServer={false}
          isTiebreak={snap.isTiebreak}
          onTap={() => {
            unlockAudio();
            setHistory((prev) => [...prev, { snap: structuredClone(snap), faultCount }]);
            setSnap((prev) => ({ ...prev, server: otherPlayer(prev.server) }));
          }}
        />

        <div className="mt-1.5">
          <ScoreCard
            leftScore={leftPoint}
            rightScore={rightPoint}
            callText={callLabel.text}
            sets={snap.sets}
          />
        </div>

        <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#718066] sm:mt-3 sm:text-[11px] sm:tracking-[0.32em]">
          Umpire Calls
        </div>

        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:mt-2.5 sm:gap-3">
          <UmpireBtn
            title="Fault"
            subtitle={faultCount === 0 ? "1st serve" : "double fault"}
            icon={<FaultIcon />}
            tone="fault"
            onClick={handleFault}
          />
          <UmpireBtn title="Let" subtitle="replay point" icon={<LetIcon />} tone="neutral" onClick={handleLet} />
        </div>

        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:mt-2.5 sm:gap-3">
          <PointBtn side="server" onClick={() => handlePoint(snap.server)} />
          <PointBtn side="receiver" onClick={() => handlePoint(otherPlayer(snap.server))} />
        </div>

        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:mt-2.5 sm:gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleUndo}
            className="flex min-h-[52px] items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.08)] text-[13px] font-medium text-[#D7DDD3] backdrop-blur-md sm:min-h-[60px] sm:text-[15px]"
          >
            <UndoIcon />
            Undo
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex min-h-[52px] items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.08)] text-[13px] font-medium text-[#FFD1C3] backdrop-blur-md sm:min-h-[60px] sm:text-[15px]"
          >
            <ResetIcon />
            Reset
          </motion.button>
        </div>
      </div>

      <AnnouncementOverlay
        announcement={announcement}
        winnerLabel={announcement ? announcement.winnerRole : ""}
        onDismiss={() => setAnnouncement(null)}
        onResetAfterMatch={resetMatch}
      />

      <SettingsSheet
        open={settingsOpen}
        deuceRules={deuceRules}
        tiebreakEnabled={tiebreakEnabled}
        audioOn={audioOn}
        vibrationOn={vibrationOn}
        onClose={() => setSettingsOpen(false)}
        onToggleDeuce={() => setDeuceRules((prev) => !prev)}
        onToggleTiebreak={() => setTiebreakEnabled((prev) => !prev)}
        onToggleAudio={() => setAudioOn((prev) => !prev)}
        onToggleVibration={() => setVibrationOn((prev) => !prev)}
      />
    </main>
  );
}
