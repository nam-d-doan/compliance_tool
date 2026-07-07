import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

async function unregisterStaleMswWorker(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map(async (registration) => {
      const scriptUrl = registration.active?.scriptURL ?? "";
      if (scriptUrl.includes("mockServiceWorker")) {
        await registration.unregister();
        console.info("[MSW] Unregistered stale service worker:", scriptUrl);
      }
    }),
  );
}

async function enableMocking() {
  // Development: intercept /api/* with a direct fetch override. This avoids
  // the service-worker lifecycle issues (stale registrations, HMR conflicts)
  // that the MSW worker causes during local development.
  if (import.meta.env.DEV) {
    await unregisterStaleMswWorker();
    const { enableDirectMocking } = await import("./mocks/directApi");
    await enableDirectMocking();
    console.info("[DirectMock] Mock API initialized");
    return;
  }

  // Production: only start the MSW service worker when explicitly requested
  // via VITE_ENABLE_MSW=1 (e.g. demo/produzione builds).
  if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_MSW === "1") {
    const { worker } = await import("./mocks/browser");
    await worker.start({
      onUnhandledRequest: "bypass",
    });
    console.info("[MSW] Mock worker started");
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
