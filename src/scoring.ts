import type {
  Announcement,
  AudioKey,
  MatchSnap,
  Player,
  PointLabel,
  ScoreUpdate,
  SetScore
} from "./types";

export const GAMES_PER_SET = 6;
export const SETS_TO_WIN = 2;
export const COOLDOWN_MS = 250;

const POINT_WORDS = ["LOVE", "FIFTEEN", "THIRTY", "FORTY"] as const;
const POINT_AUDIO_MATRIX: AudioKey[][] = [
  ["love-all", "love-fifteen", "love-thirty", "love-forty"],
  ["fifteen-love", "fifteen-all", "fifteen-thirty", "fifteen-forty"],
  ["thirty-love", "thirty-fifteen", "thirty-all", "thirty-forty"],
  ["forty-love", "forty-fifteen", "forty-thirty", "forty-all"]
];

export function otherPlayer(player: Player): Player {
  return player === "A" ? "B" : "A";
}

export function createInitialSnap(): MatchSnap {
  return {
    pa: 0,
    pb: 0,
    ga: 0,
    gb: 0,
    sets: [],
    setWinner: null,
    matchWinner: null,
    server: "A",
    isTiebreak: false,
    tbPa: 0,
    tbPb: 0,
    tbFirstServer: "A"
  };
}

export function getRoleLabel(player: Player, server: Player): "Server" | "Receiver" {
  return player === server ? "Server" : "Receiver";
}

function normalizePoints(value: number): number {
  return Math.min(value, 3);
}

function buildAnnouncement(
  kind: Announcement["kind"],
  winner: Player,
  winnerRole: "Server" | "Receiver",
  sets: SetScore[]
): Announcement {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    kind,
    winner,
    winnerRole,
    sets
  };
}

export function getCurrentServerForTiebreak(firstServer: Player, pointsPlayed: number): Player {
  if (pointsPlayed <= 0) {
    return firstServer;
  }

  const block = Math.floor((pointsPlayed - 1) / 2);
  return block % 2 === 0 ? otherPlayer(firstServer) : firstServer;
}

function buildStandardCall(pa: number, pb: number, deuceRules: boolean, server: Player): PointLabel {
  if (deuceRules && pa >= 3 && pb >= 3) {
    if (pa === pb) {
      return { text: "DEUCE", audioKey: "deuce" };
    }

    const leader = pa > pb ? "A" : "B";
    return leader === server
      ? { text: "ADVANTAGE SERVER", audioKey: "advantage-server" }
      : { text: "ADVANTAGE RECEIVER", audioKey: "advantage-receiver" };
  }

  const a = normalizePoints(pa);
  const b = normalizePoints(pb);
  const isAll = a === b;
  return {
    text: isAll ? `${POINT_WORDS[a]} ALL` : `${POINT_WORDS[a]} ${POINT_WORDS[b]}`,
    audioKey: POINT_AUDIO_MATRIX[a][b]
  };
}

export function getScoreCall(snap: MatchSnap, deuceRules: boolean): PointLabel {
  if (snap.isTiebreak) {
    if (snap.tbPa === snap.tbPb) {
      return { text: `${snap.tbPa} ALL` };
    }

    return { text: `${snap.tbPa} ${snap.tbPb}` };
  }

  return buildStandardCall(snap.pa, snap.pb, deuceRules, snap.server);
}

function didWinGame(pa: number, pb: number, deuceRules: boolean): Player | null {
  if (deuceRules) {
    if (pa >= 4 || pb >= 4) {
      const diff = pa - pb;
      if (Math.abs(diff) >= 2) {
        return diff > 0 ? "A" : "B";
      }
    }

    return null;
  }

  if (pa >= 4 || pb >= 4) {
    return pa > pb ? "A" : "B";
  }

  return null;
}

function didWinTiebreak(pa: number, pb: number): Player | null {
  if ((pa >= 7 || pb >= 7) && Math.abs(pa - pb) >= 2) {
    return pa > pb ? "A" : "B";
  }

  return null;
}

function didWinSet(ga: number, gb: number): Player | null {
  if ((ga >= GAMES_PER_SET || gb >= GAMES_PER_SET) && Math.abs(ga - gb) >= 2) {
    return ga > gb ? "A" : "B";
  }

  return null;
}

function didWinMatch(sets: SetScore[]): Player | null {
  const wonByA = sets.filter((set) => set.a > set.b).length;
  const wonByB = sets.filter((set) => set.b > set.a).length;

  if (wonByA >= SETS_TO_WIN) {
    return "A";
  }

  if (wonByB >= SETS_TO_WIN) {
    return "B";
  }

  return null;
}

export function awardPoint(snap: MatchSnap, winner: Player, deuceRules: boolean): ScoreUpdate {
  const next: MatchSnap = structuredClone(snap);
  next.setWinner = null;

  if (next.matchWinner) {
    return { snap: next, pointCall: getScoreCall(next, deuceRules) };
  }

  if (next.isTiebreak) {
    if (winner === "A") {
      next.tbPa += 1;
    } else {
      next.tbPb += 1;
    }

    const tiebreakWinner = didWinTiebreak(next.tbPa, next.tbPb);
    if (!tiebreakWinner) {
      const pointsPlayed = next.tbPa + next.tbPb;
      next.server = getCurrentServerForTiebreak(next.tbFirstServer, pointsPlayed);
      return {
        snap: next,
        pointCall: getScoreCall(next, deuceRules)
      };
    }

    if (tiebreakWinner === "A") {
      next.ga = 7;
      next.gb = 6;
    } else {
      next.ga = 6;
      next.gb = 7;
    }

    next.isTiebreak = false;
    next.pa = 0;
    next.pb = 0;
    next.tbPa = 0;
    next.tbPb = 0;
    next.server = otherPlayer(snap.server);
    next.setWinner = tiebreakWinner;
    next.sets = [...next.sets, { a: next.ga, b: next.gb }];
    next.ga = 0;
    next.gb = 0;

    const matchWinner = didWinMatch(next.sets);
    next.matchWinner = matchWinner;
    const kind = matchWinner ? "match" : "set";
    const winnerRole = tiebreakWinner === snap.server ? "Server" : "Receiver";
    return {
      snap: next,
      pointCall:
        tiebreakWinner === snap.server
          ? { text: `${matchWinner ? "MATCH" : "SET"} SERVER`, audioKey: "set-server" }
          : { text: `${matchWinner ? "MATCH" : "SET"} RECEIVER`, audioKey: "set-receiver" },
      event: buildAnnouncement(kind, matchWinner ?? tiebreakWinner, winnerRole, next.sets)
    };
  }

  if (winner === "A") {
    next.pa += 1;
  } else {
    next.pb += 1;
  }

  const gameWinner = didWinGame(next.pa, next.pb, deuceRules);
  if (!gameWinner) {
    return {
      snap: next,
      pointCall: getScoreCall(next, deuceRules)
    };
  }

  if (gameWinner === "A") {
    next.ga += 1;
  } else {
    next.gb += 1;
  }

  next.pa = 0;
  next.pb = 0;

  const winnerRole = gameWinner === snap.server ? "Server" : "Receiver";
  if (next.ga === GAMES_PER_SET && next.gb === GAMES_PER_SET) {
    next.isTiebreak = true;
    next.tbPa = 0;
    next.tbPb = 0;
    next.tbFirstServer = otherPlayer(snap.server);
    next.server = next.tbFirstServer;
    return {
      snap: next,
      pointCall:
        gameWinner === snap.server
          ? { text: "GAME SERVER", audioKey: "game-server" }
          : { text: "GAME RECEIVER", audioKey: "game-receiver" },
      event: buildAnnouncement("game", gameWinner, winnerRole, next.sets)
    };
  }

  const setWinner = didWinSet(next.ga, next.gb);
  if (!setWinner) {
    next.server = otherPlayer(snap.server);
    return {
      snap: next,
      pointCall:
        gameWinner === snap.server
          ? { text: "GAME SERVER", audioKey: "game-server" }
          : { text: "GAME RECEIVER", audioKey: "game-receiver" },
      event: buildAnnouncement("game", gameWinner, winnerRole, next.sets)
    };
  }

  next.setWinner = setWinner;
  next.sets = [...next.sets, { a: next.ga, b: next.gb }];
  next.ga = 0;
  next.gb = 0;
  next.server = otherPlayer(snap.server);

  const matchWinner = didWinMatch(next.sets);
  next.matchWinner = matchWinner;
  const setWinnerRole = setWinner === snap.server ? "Server" : "Receiver";

  return {
    snap: next,
    pointCall:
      setWinner === snap.server
        ? { text: `${matchWinner ? "MATCH" : "SET"} SERVER`, audioKey: "set-server" }
        : { text: `${matchWinner ? "MATCH" : "SET"} RECEIVER`, audioKey: "set-receiver" },
    event: buildAnnouncement(matchWinner ? "match" : "set", matchWinner ?? setWinner, setWinnerRole, next.sets)
  };
}
