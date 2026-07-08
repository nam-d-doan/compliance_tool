import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

async function purgeServiceWorkersAndCaches(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  // Unregister ALL service workers — dev mode should never have any SW
  // active. A stale SW (from a previous prod build or MSW session) will
  // intercept fetch requests and serve cached responses, causing the app
  // to show stale data even after restarting `pnpm dev`.
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map(async (registration) => {
      await registration.unregister();
      console.info("[SW] Unregistered service worker:", registration.scope);
    }),
  );

  // Clear all Cache API entries that a stale SW may have left behind.
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    if (cacheNames.length > 0) {
      console.info("[SW] Cleared caches:", cacheNames.join(", "));
    }
  }
}

async function enableMocking() {
  // Development: intercept /api/* with a direct fetch override. This avoids
  // the service-worker lifecycle issues (stale registrations, HMR conflicts)
  // that the MSW worker causes during local development.
  if (import.meta.env.DEV) {
    await purgeServiceWorkersAndCaches();
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
