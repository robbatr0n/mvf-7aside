import { useState } from "react";
import { useEvents } from "../hooks/useEvents";
import { usePlayers } from "../hooks/usePlayers";
import { useGames } from "../hooks/useGames";
import { supabase } from "../lib/supabaseClient";
import { TAGGER_PASSWORD } from "../constants";

const STORAGE_BASE =
  "https://sidixpwcmmzzpoxbpfbr.supabase.co/storage/v1/object/public/goal-clips/";

export default function ClipManager() {
  const { events, refresh } = useEvents();
  const { players } = usePlayers();
  const { games } = useGames();
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [clipInputs, setClipInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  function handleLogin() {
    if (password === TAGGER_PASSWORD) {
      setAuthed(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  }

  const goalEvents = events
    .filter((e) => e.event_type === "goal")
    .sort((a, b) => {
      const gameA = games.find((g) => g.id === a.game_id);
      const gameB = games.find((g) => g.id === b.game_id);
      return (
        new Date(gameB?.date ?? 0).getTime() -
        new Date(gameA?.date ?? 0).getTime()
      );
    });

  async function handleSave(eventId: string) {
    const filename = clipInputs[eventId]?.trim();
    if (!filename) return;
    setSaving((prev) => ({ ...prev, [eventId]: true }));

    const clip_url = filename.startsWith("http")
      ? filename
      : `${STORAGE_BASE}${filename}`;

    const { error } = await supabase
      .from("events")
      .update({ clip_url })
      .eq("id", eventId);

    if (!error) {
      setSaved((prev) => ({ ...prev, [eventId]: true }));
      refresh();
    }
    setSaving((prev) => ({ ...prev, [eventId]: false }));
  }

  async function handleRemove(eventId: string) {
    await supabase.from("events").update({ clip_url: null }).eq("id", eventId);
    refresh();
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 p-8 rounded-xl w-full max-w-sm space-y-4">
          <h1 className="text-white text-xl font-bold">Clip Manager</h1>
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Clip Manager</h1>
          <p className="text-gray-500 text-sm">
            {goalEvents.filter((e) => e.clip_url).length} of {goalEvents.length}{" "}
            goals have clips
          </p>
        </div>

        {/* Unlinked goals */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Missing Clips ({goalEvents.filter((e) => !e.clip_url).length})
          </h2>
          {goalEvents
            .filter((e) => !e.clip_url)
            .map((event) => {
              const player = players.find((p) => p.id === event.player_id);
              const game = games.find((g) => g.id === event.game_id);
              return (
                <div
                  key={event.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">
                        {player?.name ?? "—"}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {game
                          ? new Date(game.date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                    <span className="text-gray-700 text-xs">
                      {event.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="filename.mp4 or full URL"
                      value={clipInputs[event.id] ?? ""}
                      onChange={(e) =>
                        setClipInputs((prev) => ({
                          ...prev,
                          [event.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSave(event.id)
                      }
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-gray-500"
                    />
                    <button
                      onClick={() => handleSave(event.id)}
                      disabled={
                        saving[event.id] || !clipInputs[event.id]?.trim()
                      }
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    >
                      {saved[event.id] ? "✓" : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
        </section>

        {/* Linked goals */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Linked Clips ({goalEvents.filter((e) => e.clip_url).length})
          </h2>
          {goalEvents
            .filter((e) => e.clip_url)
            .map((event) => {
              const player = players.find((p) => p.id === event.player_id);
              const game = games.find((g) => g.id === event.game_id);
              return (
                <div
                  key={event.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-white font-semibold">
                      {player?.name ?? "—"}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {game
                        ? new Date(game.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                    <p className="text-gray-700 text-xs mt-0.5 truncate max-w-xs">
                      {event.clip_url}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(event.id)}
                    className="text-red-500 hover:text-red-400 text-xs transition-colors"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
        </section>
      </div>
    </div>
  );
}
