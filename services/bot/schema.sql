CREATE TABLE playersTable (osuUsername TEXT, twitterUsername TEXT, isSubscribed INT);

CREATE TABLE IF NOT EXISTS "sessionsTable" (
  "sessionID" INT,
  "tweetID" TEXT,
  "date" TEXT,
  "osuUsername" TEXT,
  "sessionDuration" TEXT,
  "globalRank" TEXT,
  "difGlobalRank" TEXT,
  "countryRank" TEXT,
  "difCountryRank" TEXT,
  "level" TEXT,
  "difLevel" TEXT,
  "accuracy" TEXT,
  "difAcc" TEXT,
  "totalPP" TEXT,
  "difPP" TEXT,
  "playCount" TEXT,
  "difPlayCount" TEXT,
  "countSSPlus" TEXT,
  "countSS" TEXT,
  "countSPlus" TEXT,
  "countS" TEXT,
  "countA" TEXT,
  "difSSPlus" TEXT,
  "difSS" TEXT,
  "difSPlus" TEXT,
  "difS" TEXT,
  "difA" TEXT,
  "rankedScore" INT,d
  "difRankedScore" TEXT,
  "secondsPlayed" INT,
);

CREATE TABLE IF NOT EXISTS "playsTable" (
  sessionId INT,
  osuUsername TEXT,
  date TEXT,
  bg TEXT,
  title TEXT,
  version TEXT,
  artist TEXT,
  combo INT,
  maxCombo INT,
  bpm REAL,
  playDuration TEXT,
  difficulty REAL,
  playAccuracy REAL,
  rank INT,
  mods TEXT,
  counts300 INT,
  counts100 INT,
  counts50 INT,
  countsMiss INT,
  playPP REAL,
  numSpinners INT,
  numSliders INT,
  numCircles INT,
  numObjects INT,
  approachRate REAL,
  healthPoINTs REAL,
  overallDifficulty REAL,
  circleSize REAL
);