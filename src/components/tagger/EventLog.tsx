import type { Event, Player, EventType } from "../../types";

interface Props {
  events: Event[];
  players: Player[];
  onUndo: (eventId: string) => void;
}

const EVENT_LABELS: Record<EventType, string> = {
  goal: "⚽ Goal",
  assist: "🎯 Assist",
  shot_on_target: "🟢 Shot on target",
  shot_off_target: "🔴 Shot off target",
  key_pass: "🔑 Key pass",
};

export default function EventLog({ events, players, onUndo }: Props) {
  const playerName = (id: string) =>
    players.find((p) => p.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-2">
      <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider">
        Tagged Events ({events.length})
      </h2>
      {events.length === 0 && (
        <p className="text-gray-600 text-sm">No events yet</p>
      )}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {[...events].reverse().map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2"
          >
            <span className="text-sm text-white">
              {EVENT_LABELS[event.event_type]}{" "}
              <span className="text-gray-400">
                — {playerName(event.player_id)}
              </span>
            </span>
            <button
              onClick={() => onUndo(event.id)}
              className="text-gray-500 hover:text-red-400 text-xs ml-4 transition-colors"
            >
              Undo
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
