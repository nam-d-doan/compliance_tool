import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// This configuration controls when and how requests are intercepted.
export const worker = setupWorker(...handlers);
