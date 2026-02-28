import { GrowthBookClient } from "@growthbook/growthbook";

const GB_API_HOST = process.env.GROWTHBOOK_API_HOST || "http://localhost:3100";
const GB_CLIENT_KEY = process.env.GROWTHBOOK_CLIENT_KEY || "sdk-placeholder";

export const gbClient = new GrowthBookClient({
  apiHost: GB_API_HOST,
  clientKey: GB_CLIENT_KEY,
});

export async function initGrowthBook() {
  await gbClient.init({ timeout: 3000 });
  console.log("GrowthBook initialized");
}
