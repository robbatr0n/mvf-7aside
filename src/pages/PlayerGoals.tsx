import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePlayers } from "../hooks/usePlayers";
import { useEvents } from "../hooks/useEvents";
import { useGames } from "../hooks/useGames";
import VideoModal from "../components/shared/VideoModal";

export default function PlayerGoals() {
  const { id } = useParams<{ id: string }>();
  const { players, loading: playersLoading } = usePlayers();
  const { events, loading: eventsLoading } = useEvents();
  const { games, loading: gamesLoading } = useGames();
  const [activeClip, setActiveClip] = useState<{
    src: string;
    label: string;
  } | null>(null);

  const loading = playersLoading || eventsLoading || gamesLoading;

  const player = players.find((p) => p.id === id);

  const goalClips = events.filter(
    (e) => e.player_id === id && e.event_type === "goal" && e.clip_url,
  );

  const grouped = games
    .filter((g) => goalClips.some((e) => e.game_id === g.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((game) => ({
      game,
      clips: goalClips.filter((e) => e.game_id === game.id),
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
          <div className="space-y-1">
            <div className="h-3 w-20 bg-gray-800 rounded animate-pulse" />
            <div className="h-7 w-32 bg-gray-800 rounded animate-pulse mt-2" />
            <div className="h-3 w-16 bg-gray-800 rounded animate-pulse mt-1" />
          </div>
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-3 w-28 bg-gray-800 rounded animate-pulse" />
                <div className="flex flex-wrap gap-3">
                  {[...Array(2)].map((_, j) => (
                    <div
                      key={j}
                      className="w-full sm:w-[calc(50%-6px)] aspect-video bg-gray-800 rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!player) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div className="space-y-1">
          <Link
            to={`/player/${id}`}
            className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
          >
            ← {player.name}
          </Link>
          <h1 className="text-2xl font-bold text-white">All goals</h1>
          <p className="text-gray-500 text-sm">
            {goalClips.length} clip{goalClips.length !== 1 ? "s" : ""}
          </p>
        </div>

        {grouped.length === 0 && (
          <p className="text-gray-600 text-sm">No clips added yet.</p>
        )}

        {grouped.map(({ game, clips }) => (
          <section key={game.id} className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              {new Date(game.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h2>
            <div className="flex flex-wrap gap-3">
              {clips.map((event, i) => (
                <div
                  key={event.id}
                  className="w-full sm:w-[calc(50%-6px)] bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden cursor-pointer"
                  onClick={() =>
                    setActiveClip({
                      src: event.clip_url!,
                      label: `Goal ${i + 1} — ${new Date(game.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
                    })
                  }
                >
                  <div className="relative">
                    <video
                      src={event.clip_url!}
                      className="w-full aspect-video object-cover"
                      preload="metadata"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/60 border border-gray-600 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[9px] border-t-transparent border-b-transparent border-l-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs px-4 py-2">
                    Goal {i + 1}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {activeClip && (
        <VideoModal
          src={activeClip.src}
          label={activeClip.label}
          onClose={() => setActiveClip(null)}
        />
      )}
    </div>
  );
}
