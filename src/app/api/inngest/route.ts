import { serve } from "inngest/next";
import { inngest } from "@/server/jobs/inngest";
import { renderVideo } from "@/server/jobs/render-video";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [renderVideo],
});
