import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
import { auditMutation } from "./cms-engine";
import { getDb } from "./db";

// This configuration controls when and how requests are intercepted.
export const worker = setupWorker(...handlers);

// Record every mocked create/update/delete in the audit trail (RFQ 5.4).
worker.events.on("response:mocked", async ({ request, response }) => {
  if (request.method === "GET") return;
  const payload = await response
    .clone()
    .json()
    .catch(() => null);
  auditMutation(
    getDb().auditLogs,
    request.method,
    new URL(request.url).pathname,
    response.status,
    payload,
  );
});
