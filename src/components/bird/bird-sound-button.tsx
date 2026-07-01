"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchBirdSound } from "@/lib/bird-sound/fetch-bird-sound";
import type { BirdSoundState } from "@/lib/bird-sound/types";
import { pushToast } from "@/lib/toast";
import { paletteHaptic } from "@/lib/haptics";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const UNAVAILABLE_COPY = "Very shy bird, no chirps recorded yet.";
const UNAVAILABLE_TOAST_MS = 2200;

function AudioWaveIcon({
  playing,
  className,
}: {
  playing: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={cn(
        "size-[18px]",
        playing && "bird-sound-waves--playing",
        className,
      )}
      aria-hidden
    >
      <rect
        x="3.5"
        y="7"
        width="2"
        height="6"
        rx="1"
        className="bird-sound-wave fill-current"
      />
      <rect
        x="9"
        y="4.5"
        width="2"
        height="11"
        rx="1"
        className="bird-sound-wave bird-sound-wave--2 fill-current"
      />
      <rect
        x="14.5"
        y="6"
        width="2"
        height="8"
        rx="1"
        className="bird-sound-wave bird-sound-wave--3 fill-current"
      />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={cn("size-[18px]", className)}
      aria-hidden
    >
      <rect x="5.5" y="4.5" width="3" height="11" rx="1" className="fill-current" />
      <rect x="11.5" y="4.5" width="3" height="11" rx="1" className="fill-current" />
    </svg>
  );
}

function LoadingRing({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-full border-2 border-foreground/10 border-t-foreground/55",
        "motion-safe:animate-spin",
        className,
      )}
    />
  );
}

export function BirdSoundButton({
  scientificName,
  className,
}: {
  scientificName: string;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<BirdSoundState>({ status: "idle" });
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarsePointer(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    setPlaying(false);
    setPaused(false);
    setBuffering(false);
    audioRef.current?.pause();

    void fetchBirdSound(scientificName)
      .then((payload) => {
        if (cancelled) return;
        if (!payload.available) {
          setState({ status: "unavailable" });
          return;
        }
        setState({ status: "ready", sound: payload });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });

    return () => {
      cancelled = true;
      audioRef.current?.pause();
      setPlaying(false);
      setPaused(false);
      setBuffering(false);
    };
  }, [scientificName]);

  const togglePlay = useCallback(() => {
    if (state.status !== "ready") return;

    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      setPaused(true);
      setBuffering(false);
      return;
    }

    if (coarsePointer) paletteHaptic("tick");
    setPaused(false);
    setBuffering(true);

    void audio.play().then(
      () => {
        setPlaying(true);
        setBuffering(false);
      },
      () => {
        setPlaying(false);
        setBuffering(false);
      },
    );
  }, [coarsePointer, playing, state]);

  const onAudioEnded = useCallback(() => {
    setPlaying(false);
    setPaused(false);
    setBuffering(false);
  }, []);

  const onAudioPlaying = useCallback(() => setBuffering(false), []);

  const onAudioWaiting = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) setBuffering(true);
  }, []);

  const showUnavailableToast = useCallback(() => {
    if (coarsePointer) paletteHaptic("tick");
    pushToast(<span>{UNAVAILABLE_COPY}</span>, UNAVAILABLE_TOAST_MS);
  }, [coarsePointer]);

  const fetchLoading = state.status === "loading" || state.status === "idle";
  const unavailable =
    state.status === "unavailable" || state.status === "error";
  const ready = state.status === "ready";
  const showRing = fetchLoading || buffering;

  const ariaLabel = (() => {
    if (ready) {
      if (buffering) return `Loading ${state.sound.soundType}`;
      if (playing) return `Pause ${state.sound.soundType}`;
      if (paused) return `Resume ${state.sound.soundType}`;
      return `Play ${state.sound.soundType}`;
    }
    if (fetchLoading) return "Checking for bird sound";
    return "Bird sound unavailable";
  })();

  const button = (
    <span className={cn("relative inline-flex size-9 shrink-0", className)}>
      {showRing ? <LoadingRing /> : null}
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={!ready && !(unavailable && coarsePointer)}
        onClick={
          unavailable && coarsePointer ? showUnavailableToast : togglePlay
        }
        className={cn(
          "relative inline-flex size-9 items-center justify-center rounded-full transition-[color,transform,background-color,opacity] duration-300 ease-out",
          ready &&
            !playing &&
            "bg-muted/70 text-foreground hover:text-foreground/55 active:scale-95",
          unavailable &&
            (coarsePointer
              ? "cursor-pointer bg-muted/70 text-muted-foreground/40 active:scale-95"
              : "cursor-default bg-muted/70 text-muted-foreground/40"),
          fetchLoading &&
            "cursor-default bg-muted/70 text-foreground/35",
        )}
      >
        {ready && paused && !playing && !buffering ? (
          <PauseIcon />
        ) : (
          <AudioWaveIcon playing={ready && playing && !buffering} />
        )}
      </button>
    </span>
  );

  return (
    <>
      {unavailable && !coarsePointer ? (
        <TooltipProvider delayDuration={250}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">{button}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="z-[100]">
              {UNAVAILABLE_COPY}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}

      {ready ? (
        <audio
          ref={audioRef}
          src={state.sound.audioUrl}
          preload="none"
          onEnded={onAudioEnded}
          onPlaying={onAudioPlaying}
          onWaiting={onAudioWaiting}
          className="hidden"
        />
      ) : null}
    </>
  );
}
