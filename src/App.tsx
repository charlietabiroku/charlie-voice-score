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
  const leftLabel = getRoleLabel("A", snap.server);
  const rightLabel = getRoleLabel("B", snap.server);
  const leftGames = snap.ga;
  const rightGames = snap.gb;
  const callLabel = getScoreCall(snap, deuceRules);
  const leftPoint = pointDisplay(snap.isTiebreak ? snap.tbPa : snap.pa, snap.isTiebreak ? snap.tbPb : snap.pb, deuceRules, snap.isTiebreak);
  const rightPoint = pointDisplay(snap.isTiebreak ? snap.tbPb : snap.pb, snap.isTiebreak ? snap.tbPa : snap.pa, deuceRules, snap.isTiebreak);

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
        <header className="mb-2.5 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo.svg" alt="Charlie Voice Score" className="h-[30px] w-[30px] shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-[16px] font-bold tracking-[-0.03em]">Charlie Voice Score</div>
              <div className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B7CC74]">
                Real-Time Tennis Umpire
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={unlockAudio}
              className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D8DED4]"
            >
              {audioStatus === "locked" ? "▶ Tap" : audioOn ? "♪ ON" : "♪ OFF"}
            </button>
            <button
              type="button"
              onClick={() => setVolumeBoost((prev) => (prev === 2 ? 4 : 2))}
              className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#D8DED4]"
            >
              {`VOL ${volumeBoost}x`}
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-sm text-[#D8DED4]"
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
            leftLabel={leftLabel}
            rightLabel={rightLabel}
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
            icon="△"
            tone="fault"
            onClick={handleFault}
          />
          <UmpireBtn title="Let" subtitle="replay point" icon="↺" tone="neutral" onClick={handleLet} />
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
            className="flex min-h-[54px] items-center justify-center rounded-[18px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.03)] text-[15px] font-semibold text-[#8D9788]"
          >
            Undo
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex min-h-[54px] items-center justify-center rounded-[18px] border border-[rgba(255,158,58,0.28)] bg-[rgba(84,30,18,0.4)] text-[15px] font-semibold text-[#FFB7A3]"
          >
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
