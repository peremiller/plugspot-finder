"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";

type Point = { lat: number; lng: number };
type TravelMode = "walk" | "drive" | "transit";
type RouteStep = { name: string; distance: number; maneuver: { type: string; modifier?: string } };
type OsrmRoute = { distance: number; duration: number; geometry: { coordinates: [number, number][] }; legs: { steps: RouteStep[] }[] };
type OsrmResponse = { routes?: OsrmRoute[]; message?: string };

function humanStep(step: RouteStep, index: number) {
  if (step.maneuver.type === "depart") return `Start toward ${step.name || "the route"}`;
  if (step.maneuver.type === "arrive") return "Arrive at your PlugSpot";
  const action = step.maneuver.modifier ? `${step.maneuver.type} ${step.maneuver.modifier}` : step.maneuver.type;
  return `${index + 1}. ${action.replaceAll("_", " ")} ${step.name ? `onto ${step.name}` : ""}`;
}

export default function LiveRoute({ origin, destination, destinationName, mode }: { origin: Point; destination: Point; destinationName: string; mode: TravelMode }) {
  const root = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const lineRef = useRef<Polyline | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const [route, setRoute] = useState<OsrmRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    import("leaflet").then((L) => {
      if (!alive || !root.current || mapRef.current) return;
      const map = L.map(root.current, { zoomControl: true, attributionControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);
      const startIcon = L.divIcon({ className: "route-pin-wrap", html: '<span class="route-pin route-pin-start" aria-hidden="true"><i></i></span>', iconSize: [30, 30], iconAnchor: [15, 15] });
      const endIcon = L.divIcon({ className: "route-pin-wrap", html: '<span class="route-pin route-pin-end" aria-hidden="true">↯</span>', iconSize: [38, 44], iconAnchor: [19, 40] });
      markerRefs.current = [
        L.marker([origin.lat, origin.lng], { icon: startIcon, title: "Your location", alt: "Route starting point" }).addTo(map).bindTooltip("Your location"),
        L.marker([destination.lat, destination.lng], { icon: endIcon, title: destinationName, alt: `Destination: ${destinationName}` }).addTo(map).bindTooltip(destinationName),
      ];
      lineRef.current = L.polyline([[origin.lat, origin.lng], [destination.lat, destination.lng]], { color: "#f25e46", weight: 5, dashArray: "8 10", opacity: .65 }).addTo(map);
      map.fitBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]], { padding: [45, 45] });
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 80);
    });
    return () => { alive = false; mapRef.current?.remove(); mapRef.current = null; markerRefs.current = []; lineRef.current = null; };
  }, [origin.lat, origin.lng, destination.lat, destination.lng, destinationName]);

  useEffect(() => {
    const controller = new AbortController();
    queueMicrotask(() => { if (!controller.signal.aborted) { setLoading(true); setError(""); } });
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=true`;
    fetch(url, { signal: controller.signal }).then(async (response) => {
      const data = await response.json() as OsrmResponse;
      if (!response.ok || !data.routes?.[0]) throw new Error(data.message || "Route unavailable");
      setRoute(data.routes[0]);
    }).catch((reason: unknown) => {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError("Live street routing is temporarily unavailable. The direct path is still shown.");
      setRoute(null);
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  useEffect(() => {
    if (!route || !mapRef.current) return;
    import("leaflet").then((L) => {
      lineRef.current?.remove();
      const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      lineRef.current = L.polyline(coordinates, { color: "#1677ff", weight: 6, opacity: .88, lineJoin: "round" }).addTo(mapRef.current!);
      mapRef.current?.fitBounds(coordinates, { padding: [45, 45] });
    });
  }, [route]);

  const distanceKm = route ? route.distance / 1000 : null;
  const minutes = useMemo(() => {
    if (!route) return null;
    if (mode === "drive") return Math.max(1, Math.round(route.duration / 60));
    const speed = mode === "walk" ? 4.7 : 17;
    return Math.max(2, Math.round((route.distance / 1000) / speed * 60));
  }, [route, mode]);
  const steps = route?.legs.flatMap((leg) => leg.steps).filter((step) => step.distance > 20).slice(0, 7) || [];

  return <div className="live-route-layout">
    <div ref={root} className="live-route-map" role="application" aria-label={`Live route map to ${destinationName}`} />
    <aside className="route-guide">
      <div className="route-stats"><span><small>TRAVEL MODE</small><b>{mode === "walk" ? "🚶 Walking" : mode === "drive" ? "🚗 Driving" : "🚌 Transit estimate"}</b></span><span><small>DISTANCE</small><b>{distanceKm ? `${distanceKm.toFixed(1)} km` : "Calculating…"}</b></span><span><small>ETA</small><b>{minutes ? `${minutes} min` : "—"}</b></span></div>
      {loading && <div className="route-loading"><i /> Finding the best live route…</div>}
      {error && <p className="route-error">{error}</p>}
      {!loading && <><h3>Turn guidance</h3><ol>{steps.length ? steps.map((step, index) => <li key={`${step.name}-${index}`}><span>{index + 1}</span><p><b>{humanStep(step, index)}</b><small>{step.distance < 1000 ? `${Math.round(step.distance)} m` : `${(step.distance / 1000).toFixed(1)} km`}</small></p></li>) : <li><span>1</span><p><b>Continue toward {destinationName}</b><small>Follow the highlighted route</small></p></li>}</ol></>}
      {mode === "transit" && <p className="route-note">Transit time is an estimate. Use the external option for current service and transfer details.</p>}
    </aside>
  </div>;
}
