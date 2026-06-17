export type Player = "A" | "B";

export type AudioStatus = "locked" | "loading" | "ready";

export type AudioKey =
  | "love-all"
  | "fifteen-love"
  | "thirty-love"
  | "forty-love"
  | "love-fifteen"
  | "fifteen-all"
  | "thirty-fifteen"
  | "forty-fifteen"
  | "love-thirty"
  | "fifteen-thirty"
  | "thirty-all"
  | "forty-thirty"
  | "love-forty"
  | "fifteen-forty"
  | "thirty-forty"
  | "forty-all"
  | "deuce"
  | "advantage-server"
  | "advantage-receiver"
  | "game-server"
  | "game-receiver"
  | "set-server"
  | "set-receiver"
  | "fault"
  | "second-serve"
  | "let"
  | "advantage-player-a"
  | "advantage-player-b"
  | "game-player-a"
  | "game-player-b"
  | "out";

export type SetScore = {
  a: number;
  b: number;
};

export type MatchSnap = {
  pa: number;
  pb: number;
  ga: number;
  gb: number;
  sets: SetScore[];
  setWinner: Player | null;
  matchWinner: Player | null;
  server: Player;
  isTiebreak: boolean;
  tbPa: number;
  tbPb: number;
  tbFirstServer: Player;
};

export type PointLabel = {
  text: string;
  audioKey?: AudioKey;
};

export type AnnouncementKind = "game" | "set" | "match";

export type Announcement = {
  id: number;
  kind: AnnouncementKind;
  winner: Player;
  winnerRole: "Server" | "Receiver";
  sets: SetScore[];
};

export type ScoreUpdate = {
  snap: MatchSnap;
  pointCall: PointLabel;
  audioChain?: AudioKey[];
  event?: Announcement;
};

export type HistoryEntry = {
  snap: MatchSnap;
  faultCount: number;
};
