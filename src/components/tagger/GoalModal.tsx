import { useState } from "react";
import type { Player } from "../../types";

interface Props {
  players: Player[];
  onConfirm: (scorerId: string, assisterId: string | null) => void;
  onCancel: () => void;
}

type Step = "scorer" | "assister";

export default function GoalModal({ players, onConfirm, onCancel }: Props) {
  const [step, setStep] = useState<Step>("scorer");
  const [scorerId, setScorerId] = useState<string | null>(null);

  function handleScorerSelect(id: string) {
    setScorerId(id);
    setStep("assister");
  }

  function handleConfirm(assisterId: string | null) {
    if (!scorerId) return;
    onConfirm(scorerId, assisterId);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md space-y-4">
        {step === "scorer" && (
          <>
            <div className="space-y-1">
              <h2 className="text-white text-lg font-semibold">
                ⚽ Who scored?
              </h2>
              <p className="text-gray-500 text-sm">
                Scorer also gets a shot on target
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleScorerSelect(player.id)}
                  className="bg-gray-800 hover:bg-green-700 text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors"
                >
                  {player.name}
                </button>
              ))}
            </div>
          </>
        )}

        {step === "assister" && (
          <>
            <div className="space-y-1">
              <h2 className="text-white text-lg font-semibold">
                🎯 Who assisted?
              </h2>
              <p className="text-gray-500 text-sm">
                Assister also gets a key pass
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {players
                .filter((p) => p.id !== scorerId)
                .map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleConfirm(player.id)}
                    className="bg-gray-800 hover:bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors"
                  >
                    {player.name}
                  </button>
                ))}
              <button
                onClick={() => handleConfirm(null)}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg px-4 py-3 text-sm font-medium transition-colors col-span-2"
              >
                No assist
              </button>
            </div>
          </>
        )}

        <button
          onClick={onCancel}
          className="w-full text-gray-500 hover:text-white text-sm transition-colors pt-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
