"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AudioNodes = {
  context: AudioContext;
  gain: GainNode;
  noise: AudioBufferSourceNode;
  hum: OscillatorNode;
};

export function useSoundscape() {
  const [ambienceOn, setAmbienceOn] = useState(false);
  const nodes = useRef<AudioNodes | null>(null);

  const stopAmbience = useCallback(() => {
    const active = nodes.current;
    if (!active) return;
    active.gain.gain.setTargetAtTime(0, active.context.currentTime, 0.08);
    window.setTimeout(() => {
      try { active.noise.stop(); active.hum.stop(); void active.context.close(); } catch { /* Already stopped. */ }
    }, 260);
    nodes.current = null;
    setAmbienceOn(false);
  }, []);

  const startAmbience = useCallback(() => {
    if (nodes.current || typeof window === "undefined") return;
    const context = new AudioContext();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const noise = context.createBufferSource();
    const hum = context.createOscillator();
    const humGain = context.createGain();
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    noise.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = 620;
    filter.Q.value = 0.4;
    hum.type = "sine";
    hum.frequency.value = 58;
    humGain.gain.value = 0.012;
    gain.gain.value = 0;
    noise.connect(filter).connect(gain);
    hum.connect(humGain).connect(gain);
    gain.connect(context.destination);
    noise.start();
    hum.start();
    gain.gain.setTargetAtTime(0.026, context.currentTime, 0.18);
    nodes.current = { context, gain, noise, hum };
    setAmbienceOn(true);
  }, []);

  const toggleAmbience = useCallback(() => {
    if (nodes.current) stopAmbience(); else startAmbience();
  }, [startAmbience, stopAmbience]);

  const cue = useCallback((kind: "tap" | "route" | "connected") => {
    if (!ambienceOn || typeof window === "undefined") return;
    const context = nodes.current?.context;
    if (!context) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = kind === "tap" ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(kind === "tap" ? 360 : 520, now);
    if (kind !== "tap") oscillator.frequency.exponentialRampToValueAtTime(kind === "route" ? 760 : 920, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "tap" ? 0.025 : 0.055, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "tap" ? 0.08 : 0.26));
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }, [ambienceOn]);

  useEffect(() => {
    const handleVisibility = () => { if (document.hidden) stopAmbience(); };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { document.removeEventListener("visibilitychange", handleVisibility); stopAmbience(); };
  }, [stopAmbience]);

  return { ambienceOn, toggleAmbience, cue };
}
