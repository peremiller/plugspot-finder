"use client";

import { useEffect, useState } from "react";
import PlugSpotLogo from "./plugspot-logo";

export default function RealisticLoader({ onComplete }: { onComplete?: () => void }) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<"face" | "search" | "found">("face");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timings = reduced ? [350, 700, 1050] : [1850, 3750, 5100];
    const searchTimer = window.setTimeout(() => setPhase("search"), timings[0]);
    const foundTimer = window.setTimeout(() => setPhase("found"), timings[1]);
    const finishTimer = window.setTimeout(() => finish(), timings[2]);
    return () => [searchTimer, foundTimer, finishTimer].forEach(window.clearTimeout);
    // The finish callback is stable for the lifetime of this one-shot loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    setVisible(false);
    onComplete?.();
  }

  if (!visible) return null;

  return <section className={`real-loader ${phase}`} aria-label="PlugSpot is finding a nearby outlet" aria-live="polite">
    <div className="loader-frame loader-face" role="img" aria-label="A person walking while holding a laptop plug and looking for a socket"/>
    <div className="loader-frame loader-search" role="img" aria-label="The same person looking in several directions for an available socket"/>
    <div className="loader-shade"/>
    <header><PlugSpotLogo/><button onClick={finish}>Skip intro</button></header>
    <div className="loader-copy">
      <span className="loader-step">{phase === "face" ? "LOOKING FOR POWER" : phase === "search" ? "SCANNING NEARBY SPACES" : "SOCKET FOUND"}</span>
      <h1>{phase === "found" ? "Your next PlugSpot is ready." : "Finding a place that works for you."}</h1>
      <p>{phase === "face" ? "Checking nearby workspaces for a reliable socket…" : phase === "search" ? "Looking across seats, walls and shared tables…" : "Power, Wi-Fi and a seat—verified."}</p>
      <div className="loader-progress"><i/></div>
    </div>
    <div className="socket-radar" aria-hidden="true"><span>↯</span><i/><i/><i/></div>
  </section>;
}
