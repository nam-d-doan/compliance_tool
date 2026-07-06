import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { useAuthStore } from "@/stores/authStore";
import { DEMO_USERS } from "@/constants/demo-users";

// Demo bypass: when true, auto-authenticate as admin and skip login.
// Toggle via VITE_DEMO_BYPASS_AUTH env var (defaults to true for this demo build).
const DEMO_BYPASS_AUTH = import.meta.env.VITE_DEMO_BYPASS_AUTH !== "false";

function applyDemoBypass() {
  if (!DEMO_BYPASS_AUTH) return;
  const { isAuthenticated, login } = useAuthStore.getState();
  if (isAuthenticated) return;
  const admin = DEMO_USERS[0];
  login(
    {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    },
    "demo-bypass-token",
  );
  console.info("[Demo] Bypass auth enabled — auto-logged in as", admin.email);
}

// Initialize direct mock API in development environment
async function enableMocking() {
  if (import.meta.env.PROD) {
    return;
  }

  const { enableDirectMocking } = await import("./mocks/directApi");
  await enableDirectMocking();
  console.info("[DirectMock] Mock API initialized");
}

enableMocking().then(() => {
  applyDemoBypass();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
