import { Inngest } from "inngest";
import { logServiceInitialized } from "./startup";

export const inngest = new Inngest({
  id: "ai-shorts-generator",
});

logServiceInitialized("inngest", { id: "ai-shorts-generator" });
