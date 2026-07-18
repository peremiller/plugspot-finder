"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";

export type AiPlace = {
  id: number;
  name: string;
  area: string;
  distanceKm: number | null;
  open: boolean;
  hours: string;
  outlets: number;
  wifiMbps: number;
  noise: string;
  workability: number;
};

type Recommendation = { placeId: number; reason: string; tradeoff: string };
type Plan = { summary: string; recommendations: Recommendation[] };
type Verification = {
  verdict: "useful" | "unclear" | "not_relevant";
  outletsVisible: number;
  seatingVisible: boolean;
  confidence: "high" | "medium" | "low";
  note: string;
};

export default function AiAssistant({
  places,
  activePlaceName,
  onSelect,
  initialOpen = false,
  onOpenChange,
}: {
  places: AiPlace[];
  activePlaceName: string;
  onSelect: (id: number) => void;
  initialOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [tab, setTab] = useState<"plan" | "photo">("plan");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [need, setNeed] = useState("Quiet place for a two-hour video call with fast Wi-Fi and several outlets");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => onOpenChange?.(open), [onOpenChange, open]);

  useEffect(() => {
    if (!open || configured !== null) return;
    const controller = new AbortController();
    fetch("/api/ai/status", { signal: controller.signal })
      .then(async (response) => await response.json() as { configured?: boolean })
      .then((data) => setConfigured(Boolean(data.configured)))
      .catch(() => setConfigured(false));
    return () => controller.abort();
  }, [configured, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function createPlan(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ need, places }),
      });
      const data = await response.json() as { plan?: Plan; error?: string; code?: string };
      if (!response.ok) {
        if (data.code === "OPENAI_NOT_CONFIGURED") setConfigured(false);
        throw new Error(data.error ?? "Could not create a plan.");
      }
      if (!data.plan) throw new Error("The assistant returned an incomplete plan.");
      setPlan(data.plan);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not create a plan.");
    } finally {
      setLoading(false);
    }
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setVerification(null);
    setError("");
    if (!file) return setImage(null);
    if (!(["image/jpeg", "image/png", "image/webp"].includes(file.type)) || file.size > 5_000_000) {
      setImage(null);
      setError("Choose a JPEG, PNG, or WebP image smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setError("The photo could not be read.");
    reader.readAsDataURL(file);
  }

  async function verifyPhoto() {
    if (!image) return;
    setLoading(true);
    setError("");
    setVerification(null);
    try {
      const response = await fetch("/api/ai/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, placeName: activePlaceName }),
      });
      const data = await response.json() as { verification?: Verification; error?: string; code?: string };
      if (!response.ok) {
        if (data.code === "OPENAI_NOT_CONFIGURED") setConfigured(false);
        throw new Error(data.error ?? "Could not verify this photo.");
      }
      if (!data.verification) throw new Error("The assistant returned an incomplete verification.");
      setVerification(data.verification);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not verify this photo.");
    } finally {
      setLoading(false);
    }
  }

  return <>
    <button className="ai-launch" onClick={() => setOpen(true)}><span>✦</span> Ask PlugSpot AI</button>
    {open && <div className="modal-backdrop ai-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
      <section ref={dialogRef} className="ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-title" onMouseDown={(event) => event.stopPropagation()}>
        <button autoFocus className="modal-close" onClick={() => setOpen(false)} aria-label="Close PlugSpot AI">×</button>
        <header>
          <span className="ai-mark">✦</span>
          <div><p className="eyebrow"><span/> POWERED BY OPENAI</p><h2 id="ai-title">Your workspace copilot</h2><p>Plan around verified place data or check what a community photo actually shows.</p></div>
        </header>
        <div className="ai-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "plan"} className={tab === "plan" ? "active" : ""} onClick={() => { setTab("plan"); setError(""); }}>Plan my session</button>
          <button role="tab" aria-selected={tab === "photo"} className={tab === "photo" ? "active" : ""} onClick={() => { setTab("photo"); setError(""); }}>Verify a photo</button>
        </div>
        {configured === false && <div className="ai-setup" role="status"><b>OpenAI setup pending</b><span>An account owner needs to add <code>OPENAI_API_KEY</code> as an encrypted hosting secret. Map and community features remain available.</span><a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">Create a restricted project key ↗</a></div>}
        {tab === "plan" ? <form className="ai-panel" onSubmit={createPlan}>
          <label>Describe the work session you need<textarea value={need} minLength={3} maxLength={500} onChange={(event) => setNeed(event.target.value)} placeholder="Example: a quiet free place for a 4 PM client call"/></label>
          <div className="ai-prompts">{["Fast Wi-Fi for a video call", "Free and quiet for deep work", "Open late with many outlets"].map((prompt) => <button type="button" key={prompt} onClick={() => setNeed(prompt)}>{prompt}</button>)}</div>
          <button className="primary" type="submit" disabled={loading || configured === false}>{loading ? "Planning…" : "Build my plan ✦"}</button>
          {plan && <div className="ai-result"><p>{plan.summary}</p>{plan.recommendations.map((item) => {
            const place = places.find((candidate) => candidate.id === item.placeId);
            if (!place) return null;
            return <button type="button" key={item.placeId} onClick={() => { onSelect(item.placeId); setOpen(false); }}><span><b>{place.name}</b><small>{place.area} · {place.wifiMbps} Mbps · {place.outlets} outlets</small></span><p>{item.reason}</p><em>{item.tradeoff}</em><strong>View place →</strong></button>;
          })}</div>}
        </form> : <div className="ai-panel">
          <label className="photo-drop">Community workspace photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage}/><span>{image ? "Photo ready to check" : "Choose a photo · JPEG, PNG or WebP · max 5 MB"}</span></label>
          {image && <Image className="ai-preview" src={image} alt="Photo selected for outlet verification" width={960} height={540} unoptimized/>}
          <button className="primary" type="button" onClick={verifyPhoto} disabled={!image || loading || configured === false}>{loading ? "Checking photo…" : "Check visible evidence ✦"}</button>
          <small className="ai-caveat">AI can identify visible outlets and seating, but cannot prove that outlets work or estimate Wi-Fi speed from an image.</small>
          {verification && <div className="verify-result"><b>{verification.verdict.replace("_", " ")} · {verification.confidence} confidence</b><span>{verification.outletsVisible} visible outlet{verification.outletsVisible === 1 ? "" : "s"} · {verification.seatingVisible ? "seating visible" : "no clear seating"}</span><p>{verification.note}</p></div>}
        </div>}
        {error && <p className="ai-error" role="alert">{error}</p>}
        <footer>Recommendations use current PlugSpot data. Confirm conditions before traveling.</footer>
      </section>
    </div>}
  </>;
}
