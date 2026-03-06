import { useState } from "react";
import { TAGGER_PASSWORD } from "../constants";
import { useGames } from "../hooks/useGames";
import { setGameResult } from "../services/games";
import GameSetup from "../components/tagger/GameSetup";
import EventLogger from "../components/tagger/EventLogger";
import type { Game, Player } from "../types";

type Phase = "auth" | "setup" | "tagging" | "result";

export default function Tagger() {
  const [phase, setPhase] = useState<Phase>("auth");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [game, setGame] = useState<Game | null>(null);
  const [activePlayers, setActivePlayers] = useState<Player[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<Map<string, 1 | 2>>(
    new Map(),
  );
  const [submitting, setSubmitting] = useState(false);
  const { refresh: refreshGames } = useGames();
  const [isExistingGame, setIsExistingGame] = useState(false);

  function handleLogin() {
    if (password === TAGGER_PASSWORD) {
      setPhase("setup");
      setError("");
    } else {
      setError("Incorrect password");
    }
  }

  function handleGameReady(
    game: Game,
    players: Player[],
    assignments: Map<string, 1 | 2>,
    existing = false,
  ) {
    setGame(game);
    setActivePlayers(players);
    setTeamAssignments(assignments);
    setIsExistingGame(existing);
    setPhase("tagging");
  }

  async function handleResult(result: 0 | 1 | 2) {
    if (!game) return;
    setSubmitting(true);
    await setGameResult(game.id, result);
    refreshGames();
    setPhase("setup");
    setGame(null);
    setActivePlayers([]);
    setTeamAssignments(new Map());
    setSubmitting(false);
  }

  if (phase === "auth") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 p-8 rounded-xl w-full max-w-sm space-y-4">
          <h1 className="text-white text-xl font-bold">Tagger</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 outline-none"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 font-medium"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  if (phase === "setup") {
    return <GameSetup onReady={handleGameReady} />;
  }

  if (phase === "result") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-white">Game Result</h1>
            <p className="text-gray-500 text-sm">
              {game &&
                new Date(game.date).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleResult(1)}
              disabled={submitting}
              className="w-full bg-gray-900 border border-gray-800 hover:border-blue-600 rounded-2xl px-6 py-5 text-left transition-all disabled:opacity-40"
            >
              <p className="text-white font-bold text-lg">Non Bibs Win</p>
              <p className="text-gray-500 text-sm mt-0.5">
                Team 1 won this game
              </p>
            </button>
            <button
              onClick={() => handleResult(2)}
              disabled={submitting}
              className="w-full bg-gray-900 border border-gray-800 hover:border-orange-600 rounded-2xl px-6 py-5 text-left transition-all disabled:opacity-40"
            >
              <p className="text-orange-400 font-bold text-lg">🟠 Bibs Win</p>
              <p className="text-gray-500 text-sm mt-0.5">
                Team 2 won this game
              </p>
            </button>
            <button
              onClick={() => handleResult(0)}
              disabled={submitting}
              className="w-full bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl px-6 py-5 text-left transition-all disabled:opacity-40"
            >
              <p className="text-gray-300 font-bold text-lg">Draw</p>
              <p className="text-gray-500 text-sm mt-0.5">
                Teams drew this game
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EventLogger
      game={game!}
      activePlayers={activePlayers}
      teamAssignments={teamAssignments}
      onFinish={() => {
        if (isExistingGame) {
          setPhase("setup");
          setGame(null);
          setActivePlayers([]);
          setTeamAssignments(new Map());
          setIsExistingGame(false);
        } else {
          setPhase("result");
        }
      }}
    />
  );
}
