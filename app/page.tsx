import { getChatGPTUser } from "./chatgpt-auth";
import PlugSpotClient from "./plugspot-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const identity = await getChatGPTUser();
  const user = identity ? { displayName: identity.displayName, email: identity.email } : null;
  return <PlugSpotClient user={user} initialPath="/" />;
}
