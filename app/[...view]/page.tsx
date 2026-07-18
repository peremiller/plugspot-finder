import type { Metadata } from "next";
import { getChatGPTUser } from "../chatgpt-auth";
import PlugSpotClient from "../plugspot-client";

export const dynamic = "force-dynamic";

const placeNames: Record<string, string> = {
  "common-room": "Common Room, Alabang",
  "yardstick-coffee": "Yardstick Coffee, BGC",
  commune: "Commune, Makati",
  "the-study": "The Study, Quezon City",
  "work-folk": "Work Folk, Pasig",
  "coffee-project": "Coffee Project, Las Piñas",
};

function readableSlug(slug = "") {
  return placeNames[slug] ?? slug.split("-").map((word) => word ? word[0].toUpperCase() + word.slice(1) : "").join(" ");
}

export async function generateMetadata({ params }: { params: Promise<{ view: string[] }> }): Promise<Metadata> {
  const { view } = await params;
  const [page, slug] = view;
  const title = page === "route" ? `Route to ${readableSlug(slug)}`
    : page === "report" ? `Report ${readableSlug(slug)}`
    : page === "claim" ? `Claim ${readableSlug(slug)}`
    : page === "place" ? readableSlug(slug)
    : page === "ai" ? "AI Workspace Planner"
    : page === "community" ? "Community Pulse"
    : page === "saved" ? "Saved Places"
    : page === "signin" ? "Sign In"
    : "All Places";
  return { title };
}

export default async function PlugSpotView({ params }: { params: Promise<{ view: string[] }> }) {
  const [{ view }, identity] = await Promise.all([params, getChatGPTUser()]);
  const user = identity ? { displayName: identity.displayName, email: identity.email } : null;
  return <PlugSpotClient user={user} initialPath={`/${view.join("/")}`} />;
}
