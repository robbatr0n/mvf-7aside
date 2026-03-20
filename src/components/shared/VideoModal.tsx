import { useEffect } from "react";

interface Props {
  src: string;
  label: string;
  onClose: () => void;
}

export default function VideoModal({ src, label, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.95)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">{label}</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>
        <video
          src={src}
          className="w-full rounded-xl"
          autoPlay
          controls
          playsInline
        />
      </div>
    </div>
  );
}
