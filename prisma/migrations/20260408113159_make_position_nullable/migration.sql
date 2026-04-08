-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MatchResult" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER NOT NULL,
    "position" TEXT,
    "osakPlayerId" INTEGER,
    "opponentPlayerId" INTEGER,
    "result" TEXT NOT NULL,
    "score" TEXT,
    "notes" TEXT,
    CONSTRAINT "MatchResult_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MatchResult_osakPlayerId_fkey" FOREIGN KEY ("osakPlayerId") REFERENCES "OsakaPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MatchResult_opponentPlayerId_fkey" FOREIGN KEY ("opponentPlayerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MatchResult" ("id", "matchId", "notes", "opponentPlayerId", "osakPlayerId", "position", "result", "score") SELECT "id", "matchId", "notes", "opponentPlayerId", "osakPlayerId", "position", "result", "score" FROM "MatchResult";
DROP TABLE "MatchResult";
ALTER TABLE "new_MatchResult" RENAME TO "MatchResult";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
