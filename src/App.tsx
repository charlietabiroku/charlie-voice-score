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
  getRoleLabel,
  getScoreCall,
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
    <span className="relative flex h-[40px] w-[40px] items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,#1B2816_0%,#131D12_100%)] shadow-[0_0_24px_rgba(200,245,58,0.14)]">
      <span className="h-7 w-7 rounded-full bg-[radial-gradient(circle_at_30%_25%,#EDFF9E_0%,#C8F53A_54%,#8DBA16_100%)]" />
      <span className="absolute inset-y-[6px] left-[12px] w-[2px] rounded-full bg-white/90" />
      <span className="absolute inset-y-[6px] right-[12px] w-[2px] rounded-full bg-white/90" />
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
  const [deuceRules, setDeuceRules] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
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

  const leftIsServer = snap.server === "A";
  const rightIsServer = snap.server === "B";
  const leftGames = snap.ga;
  const rightGames = snap.gb;
  const callLabel = getScoreCall(snap, deuceRules);
  const leftPoint = pointDisplay(snap.isTiebreak ? snap.tbPa : snap.pa, snap.isTiebreak ? snap.tbPb : snap.pb, deuceRules, snap.isTiebreak);
  const rightPoint = pointDisplay(snap.isTiebreak ? snap.tbPb : snap.pb, snap.isTiebreak ? snap.tbPa : snap.pa, deuceRules, snap.isTiebreak);
  const audioButtonLabel = audioOn
    ? audioStatus === "loading"
      ? "⟳ Loading"
      : "▶ Tap"
    : "♪ OFF";
  const volumeButtonLabel = `${volumeBoost === 4 ? "🔊" : "🔈"} VOL`;

  function unlockAudio() {
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
    const result = awardPoint(snap, winner, deuceRules);
    commit(result.snap, 0);

    if (audioOnRef.current) {
      const chain = [...audioLead];
      if (result.pointCall.audioKey) {
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
          audioEngine.playChained(["fault", "second-serve"]);
        }
        haptic(8, vibrationOn);
        return;
      }

      runScoring(otherPlayer(snap.server), ["out"]);
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
    <main className="flex min-h-dvh items-center justify-center bg-[#0C1A0C] px-3 py-3 text-white">
      <div className="flex h-dvh w-full max-w-[448px] flex-col overflow-hidden rounded-[34px] px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-[calc(env(safe-area-inset-top)+8px)]">
        <header className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <BrandBadge />
            <div className="min-w-0 max-w-[180px]">
              <div className="text-[18px] font-bold leading-[0.95] tracking-[-0.05em] text-white">
                Charlie Voice Score
              </div>
              <div className="mt-2 text-[11px] font-bold leading-[0.98] tracking-[-0.02em] text-[#B7CC74]">
                Real-Time Tennis Umpire
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={unlockAudio}
              className="flex h-[52px] min-w-[102px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-4 text-[11px] font-medium tracking-[-0.02em] text-[#C5CCC0]"
            >
              <span>{audioButtonLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => setVolumeBoost((prev) => (prev === 2 ? 4 : 2))}
              className="flex h-[52px] min-w-[102px] items-center justify-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-4 text-[11px] font-medium tracking-[-0.02em] text-[#C5CCC0]"
            >
              <span>{volumeButtonLabel}</span>
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="grid h-[52px] w-[52px] place-items-center rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-[18px] text-[#C5CCC0]"
            >
              ⚙
            </button>
          </div>
        </header>

        <ServeHero
          leftGames={leftGames}
          rightGames={rightGames}
          leftIsServer={leftIsServer}
          rightIsServer={rightIsServer}
          isTiebreak={snap.isTiebreak}
          onTap={() => {
            unlockAudio();
            setHistory((prev) => [...prev, { snap: structuredClone(snap), faultCount }]);
            setSnap((prev) => ({ ...prev, server: otherPlayer(prev.server) }));
          }}
        />

        <div className="mt-2.5">
          <ScoreCard
            leftScore={leftPoint}
            rightScore={rightPoint}
            callText={callLabel.text}
            sets={snap.sets}
          />
        </div>

        <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#687562]">
          Umpire Calls
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-3">
          <UmpireBtn
            title={faultCount === 0 ? "Fault" : "2nd Fault!"}
            subtitle={faultCount === 0 ? "1st serve" : "→ Double Fault"}
            icon={<FaultIcon />}
            tone="fault"
            onClick={handleFault}
          />
          <UmpireBtn title="Let" subtitle="replay point" icon={<LetIcon />} tone="neutral" onClick={handleLet} />
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-3">
          <PointBtn side="server" onClick={() => handlePoint(snap.server)} />
          <PointBtn side="receiver" onClick={() => handlePoint(otherPlayer(snap.server))} />
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleUndo}
            className="flex min-h-[60px] items-center justify-center rounded-[18px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.03)] text-[15px] font-medium text-[#8D9788]"
          >
            <UndoIcon />
            Undo
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex min-h-[60px] items-center justify-center rounded-[18px] border border-[rgba(255,158,58,0.28)] bg-[rgba(84,30,18,0.4)] text-[15px] font-medium text-[#FFB7A3]"
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
        audioOn={audioOn}
        vibrationOn={vibrationOn}
        onClose={() => setSettingsOpen(false)}
        onToggleDeuce={() => setDeuceRules((prev) => !prev)}
        onToggleAudio={() => setAudioOn((prev) => !prev)}
        onToggleVibration={() => setVibrationOn((prev) => !prev)}
      />
    </main>
  );
}
