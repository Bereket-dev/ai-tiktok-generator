"use client";

import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
  src: string;
  className?: string;
}

export default function VideoPreview({ src, className }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  return (
    <div
      className={cn(
        "relative bg-black rounded-2xl overflow-hidden aspect-[9/16] max-h-[70vh]",
        className
      )}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        playsInline
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
        loop
      />

      {/* Play/pause overlay button */}
      <button
        onClick={togglePlay}
        className="absolute inset-0 flex items-center justify-center group"
        aria-label={playing ? "Pause" : "Play"}
      >
        <div
          className={cn(
            "w-16 h-16 rounded-full bg-black/50 flex items-center justify-center transition-opacity",
            playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          )}
        >
          {playing ? (
            <Pause className="w-8 h-8 text-white" />
          ) : (
            <Play className="w-8 h-8 text-white ml-1" />
          )}
        </div>
      </button>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
}
