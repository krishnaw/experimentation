import { GrowthBook } from "@growthbook/growthbook-react";

export const growthbook = new GrowthBook({
  apiHost:
    process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST || "http://localhost:3100",
  clientKey:
    process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY || "sdk-placeholder",
  enableDevMode: true,
  trackingCallback: (experiment, result) => {
    console.log("Experiment viewed:", experiment.key, result.variationId);
  },
});
