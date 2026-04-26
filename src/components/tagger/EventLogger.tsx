import { useState, useMemo } from "react";
import { useEvents } from "../../hooks/useEvents";
import EventLog from "./EventLog";
import type { Game, Player } from "../../types";

interface Props {
  game: Game;
  activePlayers: Player[];
  teamAssignments: Map<string, 1 | 2>;
  onFinish: () => void;
}

type FlowType =
  | "goal"
  | "shot_on_target"
  | "shot_off_target"
  | "tackle"
  | "interception"
  | "pass"
  | "pass_failed";
type FlowStep = "scorer" | "assister" | "shooter" | "keypasser" | "passer" | "receiver";

interface PendingFlow {
  type: FlowType;
  step: FlowStep;
  firstPlayerId: string | null;
  goalEventId?: string;
  chained?: boolean;
}

export default function EventLogger({
  game,
  activePlayers,
  teamAssignments,
  onFinish,
}: Props) {
  const { events, createEvent, removeEvent } = useEvents();
  const [flow, setFlow] = useState<PendingFlow | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const gameEvents = events.filter((e) => e.game_id === game.id);

  const team1 = useMemo(
    () =>
      activePlayers
        .filter((p) => teamAssignments.get(p.id) === 1)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [activePlayers, teamAssignments],
  );

  const team2 = useMemo(
    () =>
      activePlayers
        .filter((p) => teamAssignments.get(p.id) === 2)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [activePlayers, teamAssignments],
  );

  function flashAction(msg: string) {
    setLastAction(msg);
    setTimeout(() => setLastAction(null), 2500);
  }

  function startFlow(type: FlowType) {
    const step: FlowStep =
      type === "goal" ? "scorer"
      : type === "pass" || type === "pass_failed" ? "passer"
      : "shooter";
    setFlow({ type, step, firstPlayerId: null });
  }

  function cancel() {
    setFlow(null);
  }

  async function handlePlayerSelect(player: Player) {
    if (!flow) return;

    // Goal flow — step 1: scorer selected — create events immediately, store goal ID
    if (flow.type === "goal" && flow.step === "scorer") {
      const goalEvent = await createEvent(game.id, player.id, "goal");
      if (!goalEvent) return;
      await createEvent(game.id, player.id, "shot_on_target", goalEvent.id);
      setFlow({
        ...flow,
        step: "assister",
        firstPlayerId: player.id,
        goalEventId: goalEvent.id,
      });
      return;
    }

    // Goal flow — step 2: assister selected
    if (flow.type === "goal" && flow.step === "assister") {
      const scorer = activePlayers.find((p) => p.id === flow.firstPlayerId);
      await createEvent(game.id, player.id, "assist", flow.goalEventId);
      await createEvent(game.id, player.id, "key_pass", flow.goalEventId);
      flashAction(`⚽ ${scorer?.name} (assist: ${player.name})`);
      setFlow(null);
      return;
    }

    // Pass failed flow — single step: passer selected
    if (flow.type === "pass_failed" && flow.step === "passer") {
      await createEvent(game.id, player.id, "pass_failed");
      flashAction(`❌ ${player.name} (pass incomplete)`);
      setFlow(null);
      return;
    }

    // Pass flow — step 1: passer selected
    if (flow.type === "pass" && flow.step === "passer") {
      setFlow({ ...flow, step: "receiver", firstPlayerId: player.id });
      return;
    }

    // Pass flow — step 2: receiver selected → chain to next pass
    if (flow.type === "pass" && flow.step === "receiver") {
      const passEvent = await createEvent(game.id, flow.firstPlayerId!, "pass_completed");
      if (!passEvent) return;
      await createEvent(game.id, player.id, "pass_received", passEvent.id);
      const passer = activePlayers.find((p) => p.id === flow.firstPlayerId);
      flashAction(`🔵 ${passer?.name} → ${player.name}`);
      setFlow({ type: "pass", step: "receiver", firstPlayerId: player.id, chained: true });
      return;
    }

    // Shot flow — step 1: shooter selected
    if (flow.step === "shooter") {
      if (flow.type === "tackle" || flow.type === "interception") {
        await createEvent(game.id, player.id, flow.type);
        flashAction(`${flow.type === "tackle" ? "💪" : "✋"} ${player.name}`);
        setFlow(null);
        return;
      }
      const shotType = flow.type as "shot_on_target" | "shot_off_target";
      const shotEvent = await createEvent(game.id, player.id, shotType);
      if (!shotEvent) return;
      setFlow({
        ...flow,
        step: "keypasser",
        firstPlayerId: player.id,
        goalEventId: shotEvent.id,
      });
      return;
    }

    // Shot flow — step 2: key passer selected
    if (flow.step === "keypasser") {
      const shooter = activePlayers.find((p) => p.id === flow.firstPlayerId);
      await createEvent(game.id, player.id, "key_pass", flow.goalEventId);
      flashAction(
        `${flow.type === "shot_on_target" ? "🟢" : "🔴"} ${shooter?.name} (KP: ${player.name})`,
      );
      setFlow(null);
      return;
    }
  }

  async function handleSkip() {
    if (!flow) return;

    if (flow.type === "goal" && flow.step === "assister") {
      const scorer = activePlayers.find((p) => p.id === flow.firstPlayerId);
      flashAction(`⚽ ${scorer?.name} (no assist)`);
      setFlow(null);
      return;
    }

    if (flow.step === "keypasser") {
      const shooter = activePlayers.find((p) => p.id === flow.firstPlayerId);
      flashAction(
        `${flow.type === "shot_on_target" ? "🟢" : "🔴"} ${shooter?.name} (no KP)`,
      );
      setFlow(null);
      return;
    }

    if (flow.type === "pass" && flow.step === "receiver") {
      const passer = activePlayers.find((p) => p.id === flow.firstPlayerId);
      await createEvent(game.id, flow.firstPlayerId!, "pass_failed");
      flashAction(`❌ ${passer?.name} (pass incomplete)`);
      setFlow(null);
      return;
    }
  }
  const promptText = (() => {
    if (!flow) return null;
    if (flow.type === "goal" && flow.step === "scorer")
      return "⚽ Goal — who scored?";
    if (flow.type === "goal" && flow.step === "assister") {
      const scorer = activePlayers.find((p) => p.id === flow.firstPlayerId);
      return `⚽ ${scorer?.name} — who assisted?`;
    }
    if (flow.step === "shooter")
      return `${flow.type === "shot_on_target" ? "🟢 Shot on Target" : "🔴 Shot off Target"} — who shot?`;
    if (flow.step === "keypasser") {
      const shooter = activePlayers.find((p) => p.id === flow.firstPlayerId);
      return `${flow.type === "shot_on_target" ? "🟢" : "🔴"} ${shooter?.name} — who played the key pass?`;
    }
    if (flow.type === "pass_failed" && flow.step === "passer") return "❌ Failed pass — who lost it?";
    if (flow.type === "pass" && flow.step === "passer") return "🔵 Pass — who passed?";
    if (flow.type === "pass" && flow.step === "receiver") {
      const passer = activePlayers.find((p) => p.id === flow.firstPlayerId);
      return flow.chained
        ? `🔵 ${passer?.name} — who received? ↩ chaining`
        : `🔵 ${passer?.name} — who received?`;
    }
  })();

  const skipLabel = (() => {
    if (!flow) return null;
    if (flow.step === "assister") return "No assist";
    if (flow.step === "keypasser") return "No key pass";
    if (flow.step === "receiver") return "Incomplete";
    return null;
  })();

  const score = useMemo(() => {
    const team1PlayerIds = new Set(team1.map((p) => p.id));
    const team2PlayerIds = new Set(team2.map((p) => p.id));
    let t1 = 0;
    let t2 = 0;
    gameEvents.forEach((e) => {
      if (e.event_type !== "goal") return;
      if (team1PlayerIds.has(e.player_id)) t1++;
      else if (team2PlayerIds.has(e.player_id)) t2++;
    });
    return { t1, t2 };
  }, [gameEvents, team1, team2]);

  const recentPlayers = useMemo(() => {
    const seen = new Set<string>();
    const result: Player[] = [];
    for (let i = gameEvents.length - 1; i >= 0 && result.length < 5; i--) {
      const pid = gameEvents[i].player_id;
      if (!seen.has(pid)) {
        seen.add(pid);
        const p = activePlayers.find((p) => p.id === pid);
        if (p) result.push(p);
      }
    }
    return result;
  }, [gameEvents, activePlayers]);

  // Which players to exclude from selection (can't assist own goal, can't key pass own shot)
  const excludeId =
    flow?.step === "assister" || flow?.step === "keypasser" || flow?.step === "receiver"
      ? flow.firstPlayerId
      : null;

  function PlayerButton({ player }: { player: Player }) {
    const excluded = player.id === excludeId;
    const isFirst = player.id === flow?.firstPlayerId;

    return (
      <button
        key={player.id}
        onClick={() => !excluded && handlePlayerSelect(player)}
        disabled={excluded || !flow}
        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          isFirst
            ? "bg-blue-600 text-white"
            : excluded
              ? "bg-gray-900 text-gray-700 cursor-not-allowed"
              : flow
                ? "bg-gray-800 hover:bg-blue-600 text-white cursor-pointer"
                : "bg-gray-900 text-gray-400 cursor-default"
        }`}
      >
        {player.name}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-white font-semibold">Tagging</span>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-2">
            <span className="text-gray-400 text-xs">Non Bibs</span>
            <span className="text-white font-black text-lg tabular-nums">
              {score.t1}
            </span>
            <span className="text-gray-700 text-sm">:</span>
            <span className="text-white font-black text-lg tabular-nums">
              {score.t2}
            </span>
            <span className="text-orange-400 text-xs">Bibs</span>
          </div>
          <button
            onClick={onFinish}
            className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Finish →
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 pt-6 gap-5">
        {/* Event buttons */}
        {!flow && (
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => startFlow("goal")}
              className="bg-green-700 hover:bg-green-600 text-white rounded-xl px-4 py-4 font-semibold transition-colors"
            >
              ⚽ Goal
            </button>
            <button
              onClick={() => startFlow("shot_on_target")}
              className="bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-4 font-medium transition-colors"
            >
              🟢 On Target
            </button>
            <button
              onClick={() => startFlow("shot_off_target")}
              className="bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-4 font-medium transition-colors"
            >
              🔴 Off Target
            </button>
            <button
              onClick={() => startFlow("tackle")}
              className="bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-4 font-medium transition-colors"
            >
              💪 Tackle
            </button>
            <button
              onClick={() => startFlow("interception")}
              className="bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-4 font-medium transition-colors"
            >
              ✋ Interception
            </button>
            <button
              onClick={() => startFlow("pass")}
              className="bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-4 font-medium transition-colors"
            >
              🔵 Pass
            </button>
            <button
              onClick={() => startFlow("pass_failed")}
              className="bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-4 font-medium transition-colors"
            >
              ✗ Failed Pass
            </button>
          </div>
        )}

        {/* Status / prompt */}
        {flow && (
          <div className="bg-blue-900/30 border border-blue-800/50 rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium text-sm">{promptText}</p>
              {lastAction && (
                <p className="text-green-400 text-xs mt-0.5">{lastAction}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {skipLabel && (
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-white text-sm transition-colors"
                >
                  {skipLabel}
                </button>
              )}
              <button
                onClick={cancel}
                className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
              >
                {flow?.chained ? "End sequence" : "Cancel"}
              </button>
            </div>
          </div>
        )}

        {/* Last action flash when idle */}
        {!flow && lastAction && (
          <div className="bg-green-900/20 border border-green-800/30 rounded-xl px-4 py-2.5">
            <p className="text-green-400 text-sm">{lastAction}</p>
          </div>
        )}

        {/* Recent players strip */}
        {flow && recentPlayers.filter((p) => p.id !== excludeId).length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Recent</p>
            <div className="flex flex-wrap gap-1.5">
              {recentPlayers
                .filter((p) => p.id !== excludeId)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePlayerSelect(p)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-700 hover:bg-blue-600 text-white transition-all"
                  >
                    {p.name}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Player grid — team 1 left, team 2 right */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Non Bibs
            </p>
            <div className="space-y-1.5">
              {team1.map((player) => (
                <PlayerButton key={player.id} player={player} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
              🟠 Bibs
            </p>
            <div className="space-y-1.5">
              {team2.map((player) => (
                <PlayerButton key={player.id} player={player} />
              ))}
            </div>
          </div>
        </div>

        <EventLog
          events={gameEvents}
          players={activePlayers}
          onUndo={removeEvent}
        />
      </div>
    </div>
  );
}
