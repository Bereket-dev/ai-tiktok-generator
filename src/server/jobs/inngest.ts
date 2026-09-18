import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "tiktok-creator",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
